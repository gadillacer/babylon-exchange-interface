import { BIG_INT_ZERO } from '../../../constants/misc'
import { getTickToPrice } from 'utils/getTickToPrice'
import JSBI from 'jsbi'
import { PoolState } from '../../../hooks/usePools'
import {
  Pool,
  FeeAmount,
  Position,
  priceToClosestTick,
  TickMath,
  tickToPrice,
  TICK_SPACINGS,
  encodeSqrtRatioX32,
  u32ToSeed,
  nearestUsableTick,
} from '@cykura/sdk'
import { Currency, Token, CurrencyAmount, Price, Rounding, sqrt } from '@cykura/sdk-core'
import { useSolana } from '@saberhq/use-solana'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useActiveWeb3ReactSol } from '../../../hooks/web3'
import { AppState } from '../../index'
import { tryParseAmount } from '../../swap/hooks'
import { useCurrencyBalances } from '../../wallet/hooks'
import { Field, Bound, typeInput, typeStartPriceInput, typeLeftRangeInput, typeRightRangeInput } from './actions'
import { tryParseTick } from './utils'
import { usePool } from 'hooks/usePools'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { PROGRAM_ID } from 'constants/addresses'
import { POOL_SEED, SOL_LOCAL, WSOL_LOCAL } from 'constants/tokens'
import { PublicKey } from '@solana/web3.js'
import * as anchor from '@project-serum/anchor'

const { BN } = anchor

export function useV3MintState(): AppState['mintV3'] {
  return useAppSelector((state) => state.mintV3)
}

export function useV3MintActionHandlers(noLiquidity: boolean | undefined): {
  onFieldAInput: (typedValue: string) => void
  onFieldBInput: (typedValue: string) => void
  onLeftRangeInput: (typedValue: string) => void
  onRightRangeInput: (typedValue: string) => void
  onStartPriceInput: (typedValue: string) => void
} {
  const dispatch = useAppDispatch()

  const onFieldAInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.CURRENCY_A, typedValue, noLiquidity: noLiquidity === true }))
    },
    [dispatch, noLiquidity]
  )

  const onFieldBInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.CURRENCY_B, typedValue, noLiquidity: noLiquidity === true }))
    },
    [dispatch, noLiquidity]
  )

  const onLeftRangeInput = useCallback(
    (typedValue: string) => {
      dispatch(typeLeftRangeInput({ typedValue }))
    },
    [dispatch]
  )

  const onRightRangeInput = useCallback(
    (typedValue: string) => {
      dispatch(typeRightRangeInput({ typedValue }))
    },
    [dispatch]
  )

  const onStartPriceInput = useCallback(
    (typedValue: string) => {
      dispatch(typeStartPriceInput({ typedValue }))
    },
    [dispatch]
  )

  return {
    onFieldAInput,
    onFieldBInput,
    onLeftRangeInput,
    onRightRangeInput,
    onStartPriceInput,
  }
}

export function useV3DerivedMintInfo(
  currencyA?: Currency,
  currencyB?: Currency,
  feeAmount?: FeeAmount,
  baseCurrency?: Currency,
  // override for existing position
  existingPosition?: Position
): {
  pool?: Pool | null
  poolState: PoolState
  ticks: { [bound in Bound]?: number | undefined }
  price?: Price<Token, Token>
  pricesAtTicks: {
    [bound in Bound]?: Price<Token, Token> | undefined
  }
  currencies: { [field in Field]?: Currency }
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> }
  dependentField: Field
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> }
  position: Position | undefined
  noLiquidity?: boolean
  errorMessage?: string
  invalidPool: boolean
  outOfRange: boolean
  invalidRange: boolean
  depositADisabled: boolean
  depositBDisabled: boolean
  invertPrice: boolean
  ticksAtLimit: { [bound in Bound]?: boolean | undefined }
} {
  const { account } = useActiveWeb3ReactSol()
  const [noLiquidity, setNoLiquidity] = useState(false)
  const { connection } = useSolana()

  const { independentField, typedValue, leftRangeTypedValue, rightRangeTypedValue, startPriceTypedValue } =
    useV3MintState()

  const dependentField = independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A

  // currencies
  const currencies: { [field in Field]?: Currency } = useMemo(
    () => ({
      [Field.CURRENCY_A]: currencyA,
      [Field.CURRENCY_B]: currencyB,
    }),
    [currencyA, currencyB]
  )

  // formatted with tokens
  let [tokenA, tokenB, baseToken] = useMemo(
    () => [currencyA?.wrapped, currencyB?.wrapped, baseCurrency?.wrapped],
    [currencyA, currencyB, baseCurrency]
  )

  // We get the arbitary SOL addr taken locally when selected from the drop down list
  // Convert this NATIVE_MINT as further all calculations are based on this
  tokenA = tokenA?.address == SOL_LOCAL.address ? WSOL_LOCAL : tokenA
  tokenB = tokenB?.address == SOL_LOCAL.address ? WSOL_LOCAL : tokenB
  baseToken = baseToken

  const [token0, token1] = useMemo(
    () =>
      tokenA && tokenB ? (tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]) : [undefined, undefined],
    [tokenA, tokenB]
  )

  // balances
  const balances = useCurrencyBalances(account ?? undefined, [
    currencies[Field.CURRENCY_A],
    currencies[Field.CURRENCY_B],
  ])
  const currencyBalances: { [field in Field]?: CurrencyAmount<Currency> } = {
    [Field.CURRENCY_A]: balances[0],
    [Field.CURRENCY_B]: balances[1],
  }

  // pool
  const pool = usePool(currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B], feeAmount)

  useEffect(() => {
    ;(async () => {
      if (token0 && token1 && feeAmount) {
        const tk0 = new PublicKey(token0.address)
        const tk1 = new PublicKey(token1.address)

        PublicKey.findProgramAddress(
          [POOL_SEED, tk0?.toBuffer(), tk1?.toBuffer(), u32ToSeed(feeAmount)],
          PROGRAM_ID
        ).then(([poolStatePDA, _]) => {
          connection.getAccountInfo(poolStatePDA).then((info) => {
            setNoLiquidity(!info)
          })
        })
      }
    })()
  }, [token0, token1, feeAmount])

  // note to parse inputs in reverse
  const invertPrice = Boolean(baseToken && token0 && !baseToken.equals(token0))

  // always returns the price with 0 as base token
  const price: Price<Token, Token> | undefined = useMemo(() => {
    // if no liquidity use typed value
    if (noLiquidity) {
      const parsedQuoteAmount = tryParseAmount(startPriceTypedValue, invertPrice ? token0 : token1)
      if (parsedQuoteAmount && token0 && token1) {
        const baseAmount = tryParseAmount('1', invertPrice ? token1 : token0)
        const price =
          baseAmount && parsedQuoteAmount
            ? new Price(
                baseAmount.currency,
                parsedQuoteAmount.currency,
                baseAmount.quotient,
                parsedQuoteAmount.quotient
              )
            : undefined
        // console.log('price', price?.toSignificant(), price?.invert().toSignificant())
        return (invertPrice ? price?.invert() : price) ?? undefined
      }
      return undefined
    } else {
      // get the amount of quote currency
      return pool && token0 ? pool.priceOf(token0) : undefined
    }
  }, [noLiquidity, startPriceTypedValue, invertPrice, token1, token0, pool])

  // check for invalid price input (converts to invalid ratio)
  const invalidPrice = useMemo(() => {
    const sqrtRatioX32 = price ? encodeSqrtRatioX32(price.numerator, price.denominator) : undefined
    const invalid =
      price &&
      sqrtRatioX32 &&
      !(
        JSBI.greaterThanOrEqual(sqrtRatioX32, TickMath.MIN_SQRT_RATIO) &&
        JSBI.lessThan(sqrtRatioX32, TickMath.MAX_SQRT_RATIO)
      )
    return invalid
  }, [price])

  // used for ratio calculation when pool not initialized
  const mockPool = useMemo(() => {
    if (token0 && token1 && feeAmount && price && !invalidPrice) {
      const currentTick = priceToClosestTick(price)
      const currentSqrt = TickMath.getSqrtRatioAtTick(currentTick)
      // console.log(currentTick, 'currentTick', currentSqrt.toString(), 'currentSqrt')
      return new Pool(token0, token1, feeAmount, currentSqrt, JSBI.BigInt(0), currentTick)
    } else {
      return undefined
    }
  }, [feeAmount, invalidPrice, price, tokenA, tokenB])

  // if pool exists use it, if not use the mock pool
  const poolForPosition: Pool | undefined = pool ?? mockPool

  // lower and upper limits in the tick space for `feeAmoun<Trans>
  const tickSpaceLimits: {
    [bound in Bound]: number | undefined
  } = useMemo(
    () => ({
      [Bound.LOWER]: feeAmount ? nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[feeAmount]) : undefined,
      [Bound.UPPER]: feeAmount ? nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[feeAmount]) : undefined,
    }),
    [feeAmount]
  )

  const ticks: {
    [key: string]: number | undefined
  } = useMemo(() => {
    return {
      [Bound.LOWER]:
        typeof existingPosition?.tickLower === 'number'
          ? existingPosition.tickLower
          : (invertPrice && typeof rightRangeTypedValue === 'boolean') ||
            (!invertPrice && typeof leftRangeTypedValue === 'boolean')
          ? tickSpaceLimits[Bound.LOWER]
          : invertPrice
          ? tryParseTick(token1, token0, feeAmount, rightRangeTypedValue.toString())
          : tryParseTick(token0, token1, feeAmount, leftRangeTypedValue.toString()),
      [Bound.UPPER]:
        typeof existingPosition?.tickUpper === 'number'
          ? existingPosition.tickUpper
          : (!invertPrice && typeof rightRangeTypedValue === 'boolean') ||
            (invertPrice && typeof leftRangeTypedValue === 'boolean')
          ? tickSpaceLimits[Bound.UPPER]
          : invertPrice
          ? tryParseTick(token1, token0, feeAmount, leftRangeTypedValue.toString())
          : tryParseTick(token0, token1, feeAmount, rightRangeTypedValue.toString()),
    }
  }, [
    existingPosition,
    feeAmount,
    invertPrice,
    leftRangeTypedValue,
    rightRangeTypedValue,
    token0,
    token1,
    tickSpaceLimits,
  ])

  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = ticks || {}
  // console.log(tickLower, tickUpper)

  // console.log(
  //   `Current Tick is ${poolForPosition?.tickCurrent.toString()}\tTick lower is ${tickLower?.toString()}\tTick upper is ${tickUpper?.toString()}`
  // )

  // specifies whether the lower and upper ticks is at the exteme bounds
  const ticksAtLimit = useMemo(
    () => ({
      [Bound.LOWER]: feeAmount && tickLower === tickSpaceLimits.LOWER,
      [Bound.UPPER]: feeAmount && tickUpper === tickSpaceLimits.UPPER,
    }),
    [tickSpaceLimits, tickLower, tickUpper, feeAmount]
  )

  // mark invalid range
  const invalidRange = Boolean(typeof tickLower === 'number' && typeof tickUpper === 'number' && tickLower >= tickUpper)

  // always returns the price with 0 as base token
  const pricesAtTicks = useMemo(() => {
    return {
      [Bound.LOWER]: getTickToPrice(token0, token1, ticks[Bound.LOWER]),
      [Bound.UPPER]: getTickToPrice(token0, token1, ticks[Bound.UPPER]),
    }
  }, [token0, token1, ticks, price])
  const { [Bound.LOWER]: lowerPrice, [Bound.UPPER]: upperPrice } = pricesAtTicks

  // console.log(
  //   `Current Price is ${price?.toSignificant()}\tPrice lower is ${lowerPrice?.toSignificant()}\tPrice upper is ${upperPrice?.toSignificant()}`
  // )
  // if (invertPrice) {
  //   console.log(
  //     `UI is inverterd Current Price is ${price?.invert().toSignificant()}\tPrice lower is ${lowerPrice
  //       ?.invert()
  //       .toSignificant()}\tPrice upper is ${upperPrice?.invert().toSignificant()}`
  //   )
  // }

  // liquidity range warning
  const outOfRange = Boolean(
    !invalidRange && price && lowerPrice && upperPrice && (price.lessThan(lowerPrice) || price.greaterThan(upperPrice))
  )

  // amounts
  const independentAmount: CurrencyAmount<Currency> | undefined = tryParseAmount(
    typedValue,
    currencies[independentField]
  )

  const dependentAmount: CurrencyAmount<Currency> | undefined = useMemo(() => {
    // we wrap the currencies just to get the price in terms of the other token
    const wrappedIndependentAmount = independentAmount?.wrapped
    const dependentCurrency = dependentField === Field.CURRENCY_B ? currencyB : currencyA
    if (
      independentAmount &&
      wrappedIndependentAmount &&
      typeof tickLower === 'number' &&
      typeof tickUpper === 'number' &&
      poolForPosition
    ) {
      // if price is out of range or invalid range - return 0 (single deposit will be independent)
      if (outOfRange || invalidRange) {
        return undefined
      }

      const position: Position | undefined = wrappedIndependentAmount.currency.equals(poolForPosition.token0)
        ? Position.fromAmount0({
            pool: poolForPosition,
            tickLower,
            tickUpper,
            amount0: independentAmount.quotient,
            useFullPrecision: true, // we want full precision for the theoretical position
          })
        : Position.fromAmount1({
            pool: poolForPosition,
            tickLower,
            tickUpper,
            amount1: independentAmount.quotient,
          })
      // }

      const dependentTokenAmount = wrappedIndependentAmount.currency.equals(poolForPosition.token0)
        ? position.amount1
        : position.amount0

      return dependentCurrency && CurrencyAmount.fromRawAmount(dependentCurrency, dependentTokenAmount.quotient)
    }

    return undefined
  }, [
    independentAmount,
    outOfRange,
    dependentField,
    currencyB,
    currencyA,
    tickLower,
    tickUpper,
    poolForPosition,
    invalidRange,
  ])

  const parsedAmounts: { [field in Field]: CurrencyAmount<Currency> | undefined } = useMemo(() => {
    return {
      [Field.CURRENCY_A]: independentField === Field.CURRENCY_A ? independentAmount : dependentAmount,
      [Field.CURRENCY_B]: independentField === Field.CURRENCY_A ? dependentAmount : independentAmount,
    }
  }, [dependentAmount, independentAmount, independentField])

  // single deposit only if price is out of range
  const deposit0Disabled = Boolean(
    typeof tickUpper === 'number' && poolForPosition && poolForPosition.tickCurrent >= tickUpper
  )
  const deposit1Disabled = Boolean(
    typeof tickLower === 'number' && poolForPosition && poolForPosition.tickCurrent <= tickLower
  )

  // sorted for token order
  const depositADisabled =
    invalidRange ||
    Boolean(
      (deposit0Disabled && poolForPosition && tokenA && poolForPosition.token0.equals(tokenA)) ||
        (deposit1Disabled && poolForPosition && tokenA && poolForPosition.token1.equals(tokenA))
    )
  const depositBDisabled =
    invalidRange ||
    Boolean(
      (deposit0Disabled && poolForPosition && tokenB && poolForPosition.token0.equals(tokenB)) ||
        (deposit1Disabled && poolForPosition && tokenB && poolForPosition.token1.equals(tokenB))
    )

  // create position entity based on users selection
  const position: Position | undefined = useMemo(() => {
    if (
      !poolForPosition ||
      !tokenA ||
      !tokenB ||
      typeof tickLower !== 'number' ||
      typeof tickUpper !== 'number' ||
      invalidRange
    ) {
      return undefined
    }

    // mark as 0 if disabled because out of range
    const amount0 = !deposit0Disabled
      ? parsedAmounts?.[tokenA.equals(poolForPosition.token0) ? Field.CURRENCY_A : Field.CURRENCY_B]?.quotient
      : BIG_INT_ZERO
    const amount1 = !deposit1Disabled
      ? parsedAmounts?.[tokenA.equals(poolForPosition.token0) ? Field.CURRENCY_B : Field.CURRENCY_A]?.quotient
      : BIG_INT_ZERO

    if (amount0 !== undefined && amount1 !== undefined) {
      return Position.fromAmounts({
        pool: poolForPosition,
        tickLower,
        tickUpper,
        amount0,
        amount1,
        useFullPrecision: true, // we want full precision for the theoretical position
      })
    } else {
      return undefined
    }
  }, [
    parsedAmounts,
    poolForPosition,
    tokenA,
    tokenB,
    deposit0Disabled,
    deposit1Disabled,
    invalidRange,
    tickLower,
    tickUpper,
  ])

  let errorMessage: string | undefined
  if (!account) {
    errorMessage = 'Connect Wallet'
  }

  if (invalidPrice) {
    errorMessage = errorMessage ?? 'Invalid price input'
  }

  if (!parsedAmounts[Field.CURRENCY_A] && !depositADisabled && !parsedAmounts[Field.CURRENCY_B] && !depositBDisabled) {
    errorMessage = errorMessage ?? 'Enter an amount'
  }

  const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts

  if (currencyAAmount && currencyBalances?.[Field.CURRENCY_A]?.lessThan(currencyAAmount)) {
    errorMessage = `Insufficient ${currencies[Field.CURRENCY_A]?.symbol} balance here`
  }

  if (currencyBAmount && currencyBalances?.[Field.CURRENCY_B]?.lessThan(currencyBAmount)) {
    errorMessage = `Insufficient ${currencies[Field.CURRENCY_B]?.symbol} balance here`
  }

  // Need to change theses
  const poolState = pool ? PoolState.EXISTS : PoolState.INVALID
  const invalidPool = false

  return {
    dependentField,
    currencies,
    pool,
    poolState,
    currencyBalances,
    parsedAmounts,
    ticks,
    price,
    pricesAtTicks,
    position,
    noLiquidity,
    errorMessage,
    invalidPool,
    invalidRange,
    outOfRange,
    depositADisabled,
    depositBDisabled,
    invertPrice,
    ticksAtLimit,
  }
}

export function useRangeHopCallbacks(
  baseCurrency: Currency | undefined,
  quoteCurrency: Currency | undefined,
  feeAmount: FeeAmount | undefined,
  tickLower: number | undefined,
  tickUpper: number | undefined,
  pool?: Pool | undefined | null
) {
  const baseToken = useMemo(() => baseCurrency?.wrapped, [baseCurrency])
  const quoteToken = useMemo(() => quoteCurrency?.wrapped, [quoteCurrency])
  const getDecrementLower = useCallback(() => {
    if (baseToken && quoteToken && typeof tickLower === 'number' && feeAmount) {
      const newPrice = tickToPrice(baseToken, quoteToken, tickLower - TICK_SPACINGS[feeAmount])
      return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
    }
    // use pool current tick as starting tick if we have pool but no tick input
    if (!(typeof tickLower === 'number') && baseToken && quoteToken && feeAmount && pool) {
      // console.log('Pool present')
      const newPrice = tickToPrice(baseToken, quoteToken, pool.tickCurrent - TICK_SPACINGS[feeAmount])
      return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
    }
    return ''
  }, [baseToken, quoteToken, tickLower, feeAmount, pool])

  const getIncrementLower = useCallback(() => {
    if (baseToken && quoteToken && typeof tickLower === 'number' && feeAmount) {
      const newPrice = tickToPrice(baseToken, quoteToken, tickLower + TICK_SPACINGS[feeAmount])
      return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
    }
    // use pool current tick as starting tick if we have pool but no tick input
    if (!(typeof tickLower === 'number') && baseToken && quoteToken && feeAmount && pool) {
      const newPrice = tickToPrice(baseToken, quoteToken, pool.tickCurrent + TICK_SPACINGS[feeAmount])
      return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
    }
    return ''
  }, [baseToken, quoteToken, tickLower, feeAmount, pool])

  const getDecrementUpper = useCallback(() => {
    if (baseToken && quoteToken && typeof tickUpper === 'number' && feeAmount) {
      const newPrice = tickToPrice(baseToken, quoteToken, tickUpper - TICK_SPACINGS[feeAmount])
      return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
    }
    // use pool current tick as starting tick if we have pool but no tick input
    if (!(typeof tickUpper === 'number') && baseToken && quoteToken && feeAmount && pool) {
      const newPrice = tickToPrice(baseToken, quoteToken, pool.tickCurrent - TICK_SPACINGS[feeAmount])
      return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
    }
    return ''
  }, [baseToken, quoteToken, tickUpper, feeAmount, pool])

  const getIncrementUpper = useCallback(() => {
    if (baseToken && quoteToken && typeof tickUpper === 'number' && feeAmount) {
      const newPrice = tickToPrice(baseToken, quoteToken, tickUpper + TICK_SPACINGS[feeAmount])
      return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
    }
    // use pool current tick as starting tick if we have pool but no tick input
    if (!(typeof tickUpper === 'number') && baseToken && quoteToken && feeAmount && pool) {
      const newPrice = tickToPrice(baseToken, quoteToken, pool.tickCurrent + TICK_SPACINGS[feeAmount])
      return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
    }
    return ''
  }, [baseToken, quoteToken, tickUpper, feeAmount, pool])

  return { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper }
}
