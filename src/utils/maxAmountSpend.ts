import { Currency, CurrencyAmount } from '@cykura/sdk-core'
import JSBI from 'jsbi'

const MIN_NATIVE_CURRENCY_FOR_GAS: JSBI = JSBI.multiply(
  JSBI.BigInt(3),
  JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(7))
) // .03 SOL

/**
 * Given some token amount, return the max that can be spent of it
 * @param currencyAmount to return max of
 */
export function maxAmountSpend(currencyAmount?: CurrencyAmount<Currency>): CurrencyAmount<Currency> | undefined {
  if (!currencyAmount) return undefined
  if (currencyAmount.currency.symbol === 'SOL') {
    if (JSBI.greaterThan(currencyAmount.quotient, MIN_NATIVE_CURRENCY_FOR_GAS)) {
      return CurrencyAmount.fromRawAmount(
        currencyAmount.currency,
        JSBI.subtract(currencyAmount.quotient, MIN_NATIVE_CURRENCY_FOR_GAS)
      )
    } else {
      return CurrencyAmount.fromRawAmount(currencyAmount.currency, JSBI.BigInt(0))
    }
  }
  return currencyAmount
}
