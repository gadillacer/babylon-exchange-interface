import { Percent, Currency, TradeType } from '@cykura/sdk-core'
import { Trade as V3Trade } from '@cykura/sdk'
import { useContext, useMemo } from 'react'
import { ThemeContext } from 'styled-components/macro'
import { TYPE } from '../../theme'
import { computeRealizedLPFeePercent } from '../../utils/prices'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import FormattedPriceImpact from './FormattedPriceImpact'
import SwapRoute from './SwapRoute'

interface AdvancedSwapDetailsProps {
  trade?: V3Trade<Currency, Currency, TradeType>
  allowedSlippage: Percent
}

export function AdvancedSwapDetails({ trade, allowedSlippage }: AdvancedSwapDetailsProps) {
  const theme = useContext(ThemeContext)

  const { realizedLPFee, priceImpact } = useMemo(() => {
    if (!trade) return { realizedLPFee: undefined, priceImpact: undefined }

    const realizedLpFeePercent = computeRealizedLPFeePercent(trade)
    const realizedLPFee = trade.inputAmount.multiply(realizedLpFeePercent)
    const priceImpact = trade.priceImpact.subtract(realizedLpFeePercent)
    return { priceImpact, realizedLPFee }
  }, [trade])

  return !trade ? null : (
    <AutoColumn gap="8px">
      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
            <span>Liquidity Provider Fee</span>
          </TYPE.black>
        </RowFixed>
        <TYPE.black textAlign="right" fontSize={12} color={theme.text1}>
          {realizedLPFee ? `${realizedLPFee.toSignificant(4)} ${realizedLPFee.currency.symbol}` : '-'}
        </TYPE.black>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
            <span>Route</span>
          </TYPE.black>
        </RowFixed>
        <TYPE.black textAlign="right" fontSize={12} color={theme.text1}>
          <SwapRoute trade={trade} />
        </TYPE.black>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
            <span>Price Impact</span>
          </TYPE.black>
        </RowFixed>
        <TYPE.black textAlign="right" fontSize={12} color={theme.text1}>
          <FormattedPriceImpact priceImpact={priceImpact} />
        </TYPE.black>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
            {trade.tradeType === TradeType.EXACT_INPUT ? <span>Minimum received</span> : <span>Maximum sent</span>}
          </TYPE.black>
        </RowFixed>
        <TYPE.black textAlign="right" fontSize={12} color={theme.text1}>
          {trade.tradeType === TradeType.EXACT_INPUT
            ? `${trade.minimumAmountOut(allowedSlippage).toSignificant(6)} ${trade.outputAmount.currency.symbol}`
            : `${trade.maximumAmountIn(allowedSlippage).toSignificant(6)} ${trade.inputAmount.currency.symbol}`}
        </TYPE.black>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
            <span>Slippage tolerance</span>
          </TYPE.black>
        </RowFixed>
        <TYPE.black textAlign="right" fontSize={12} color={theme.text1}>
          {allowedSlippage.toFixed(2)}%
        </TYPE.black>
      </RowBetween>
    </AutoColumn>
  )
}
