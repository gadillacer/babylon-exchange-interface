import { Currency, Price, Token } from '@cykura/sdk-core'
import { FeeAmount } from '@cykura/sdk'
import { AutoColumn, ColumnCenter } from 'components/Column'
import Loader from 'components/Loader'
import { format } from 'd3'
import { Text } from 'rebass'
import { useColor } from 'hooks/useColor'
import useTheme from 'hooks/useTheme'
import { saturate } from 'polished'
import React, { ReactNode, useCallback, useMemo } from 'react'
import { BarChart2, CloudOff, Inbox } from 'react-feather'
import ReactGA from 'react-ga'
import { batch } from 'react-redux'
import { Bound } from 'state/mint/v3/actions'
import styled from 'styled-components/macro'

import { Chart } from './Chart'
import { useDensityChartData } from './hooks'
import { ZoomLevels } from './types'

const ZOOM_LEVELS: Record<FeeAmount, ZoomLevels> = {
  // [FeeAmount.LOWEST]: {
  //   initialMin: 0.999,
  //   initialMax: 1.001,
  //   min: 0.00001,
  //   max: 1.5,
  // },
  [FeeAmount.SUPER_STABLE]: {
    initialMin: 0.999,
    initialMax: 1.001,
    min: 0.00001,
    max: 1.5,
  },
  [FeeAmount.TURBO_SPL]: {
    initialMin: 0.5,
    initialMax: 2,
    min: 0.00001,
    max: 20,
  },
  [FeeAmount.LOW]: {
    initialMin: 0.999,
    initialMax: 1.001,
    min: 0.00001,
    max: 1.5,
  },
  [FeeAmount.MEDIUM]: {
    initialMin: 0.5,
    initialMax: 2,
    min: 0.00001,
    max: 20,
  },
  [FeeAmount.HIGH]: {
    initialMin: 0.5,
    initialMax: 2,
    min: 0.00001,
    max: 20,
  },
}

const ChartWrapper = styled.div`
  position: relative;

  justify-content: center;
  align-content: center;
`

function InfoBox({ message, icon }: { message?: ReactNode; icon: ReactNode }) {
  return (
    <ColumnCenter style={{ height: '100%', justifyContent: 'center' }}>
      {icon}
      {message && (
        <Text padding={10} marginTop="20px" textAlign="center">
          {message}
        </Text>
      )}
    </ColumnCenter>
  )
}

export default function LiquidityChartRangeInput({
  currencyA,
  currencyB,
  feeAmount,
  ticksAtLimit,
  price,
  priceLower,
  priceUpper,
  onLeftRangeInput,
  onRightRangeInput,
  interactive,
}: {
  currencyA: Currency | undefined
  currencyB: Currency | undefined
  feeAmount?: FeeAmount
  ticksAtLimit: { [bound in Bound]?: boolean | undefined }
  price: number | undefined
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  onLeftRangeInput: (typedValue: string) => void
  onRightRangeInput: (typedValue: string) => void
  interactive: boolean
}) {
  const theme = useTheme()

  const tokenAColor = useColor(currencyA?.wrapped)
  const tokenBColor = useColor(currencyB?.wrapped)

  const isSorted = currencyA && currencyB && currencyA?.wrapped.sortsBefore(currencyB?.wrapped)

  const { isLoading, isError, error, formattedData } = useDensityChartData({
    currencyA,
    currencyB,
    feeAmount,
  })

  const onBrushDomainChangeEnded = useCallback(
    (domain, mode) => {
      let leftRangeValue = Number(domain[0])
      const rightRangeValue = Number(domain[1])

      if (leftRangeValue <= 0) {
        leftRangeValue = 1 / 10 ** 6
      }

      batch(() => {
        // simulate user input for auto-formatting and other validations
        if (
          (!ticksAtLimit[isSorted ? Bound.LOWER : Bound.UPPER] || mode === 'handle' || mode === 'reset') &&
          leftRangeValue > 0
        ) {
          onLeftRangeInput(leftRangeValue.toFixed(6))
        }

        if ((!ticksAtLimit[isSorted ? Bound.UPPER : Bound.LOWER] || mode === 'reset') && rightRangeValue > 0) {
          // todo: remove this check. Upper bound for large numbers
          // sometimes fails to parse to tick.
          if (rightRangeValue < 1e35) {
            onRightRangeInput(rightRangeValue.toFixed(6))
          }
        }
      })
    },
    [isSorted, onLeftRangeInput, onRightRangeInput, ticksAtLimit]
  )

  interactive = interactive && Boolean(formattedData?.length)

  const brushDomain: [number, number] | undefined = useMemo(() => {
    const leftPrice = isSorted ? priceLower : priceUpper?.invert()
    const rightPrice = isSorted ? priceUpper : priceLower?.invert()

    return leftPrice && rightPrice
      ? [parseFloat(leftPrice?.toSignificant(6)), parseFloat(rightPrice?.toSignificant(6))]
      : undefined
  }, [isSorted, priceLower, priceUpper])

  const brushLabelValue = useCallback(
    (d: 'w' | 'e', x: number) => {
      if (!price) return ''

      if (d === 'w' && ticksAtLimit[isSorted ? Bound.LOWER : Bound.UPPER]) return '0'
      if (d === 'e' && ticksAtLimit[isSorted ? Bound.UPPER : Bound.LOWER]) return '∞'

      const percent = (x < price ? -1 : 1) * ((Math.max(x, price) - Math.min(x, price)) / price) * 100

      return price ? `${format(Math.abs(percent) > 1 ? '.2~s' : '.2~f')(percent)}%` : ''
    },
    [isSorted, price, ticksAtLimit]
  )

  if (isError) {
    ReactGA.exception({
      ...error,
      category: 'Liquidity',
      fatal: false,
    })
  }

  return (
    <AutoColumn gap="md" style={{ minHeight: '200px' }}>
      {
        // isUninitialized ? (
        //   <InfoBox
        //     message={<span>Your position will appear here.</span>}
        //     icon={<Inbox size={56} stroke={theme.text1} />}
        //   />
        // ) :
        isLoading ? (
          <InfoBox icon={<Loader size="40px" stroke={theme.text4} />} />
        ) : isError ? (
          <InfoBox
            message={<span>Liquidity data not available.</span>}
            icon={<CloudOff size={56} stroke={theme.text4} />}
          />
        ) : !formattedData || formattedData === [] || !price ? (
          <InfoBox
            message={<span>There is no liquidity data.</span>}
            icon={<BarChart2 size={56} stroke={theme.text4} />}
          />
        ) : (
          <ChartWrapper>
            <Chart
              data={{ series: formattedData, current: price }}
              dimensions={{ width: 400, height: 200 }}
              margins={{ top: 10, right: 2, bottom: 20, left: 0 }}
              styles={{
                area: {
                  selection: theme.blue1,
                },
                brush: {
                  handle: {
                    west: saturate(0.1, tokenAColor) ?? theme.red1,
                    east: saturate(0.1, tokenBColor) ?? theme.blue1,
                  },
                },
              }}
              interactive={interactive}
              brushLabels={brushLabelValue}
              brushDomain={brushDomain}
              onBrushDomainChange={onBrushDomainChangeEnded}
              zoomLevels={ZOOM_LEVELS[feeAmount ?? FeeAmount.TURBO_SPL]}
              ticksAtLimit={ticksAtLimit}
            />
          </ChartWrapper>
        )
      }
    </AutoColumn>
  )
}