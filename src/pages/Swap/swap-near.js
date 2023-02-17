// import React, {
//     useCallback,
//     useEffect,
//     useMemo,
//     useRef,
//     useState,
//     useContext,
//   } from 'react';
//   import { useLocation, useHistory } from 'react-router-dom';
//   import { ftGetBalance, TokenMetadata } from '../../services/ft-contract';
//   import { Pool } from '../../services/pool';
//   import { useTokenBalances, useDepositableBalance } from '../../state/token';
//   import { useSwap } from '../../state/swap';
//   import {
//     calculateExchangeRate,
//     calculateFeeCharge,
//     calculateFeePercent,
//     calculateSmartRoutingPriceImpact,
//     toPrecision,
//     toReadableNumber,
//     ONLY_ZEROS,
//     multiply,
//     divide,
//     scientificNotationToString,
//     calculateSmartRoutesV2PriceImpact,
//     separateRoutes,
//     // calcStableSwapPriceImpact,
//     toInternationalCurrencySystemLongString,
//   } from '../../utils/numbers';
//   import ReactDOMServer from 'react-dom/server';
//   import TokenAmount from '../forms/TokenAmount';
//   import SubmitButton from '../forms/SubmitButton';
//   import Alert from '../Alert';
//   import { toRealSymbol } from '../../utils/token';
//   import { FormattedMessage, useIntl } from 'react-intl';
//   import { FaAngleUp, FaAngleDown, FaExchangeAlt } from 'react-icons/fa';
//   import db from '../../store/BabyDatabase';
//   import {
//     ConnectToNearBtn,
//   } from '../../components/Button';
//   import {
//     AllStableTokenIds,
//     BTCIDS,
//     BTC_STABLE_POOL_ID,
//     CUSDIDS,
//     LINEARIDS,
//     LINEAR_POOL_ID,
//     NEARXIDS,
//     NEARX_POOL_ID,
//     STABLE_POOL_TYPE,
//     STABLE_TOKEN_IDS,
//     STNEARIDS,
//     STNEAR_POOL_ID,
//     wallet,
//   } from '../../services/near';
//   import SwapFormWrap from '../forms/SwapFormWrap';
//   // import SwapTip from '../../components/forms/SwapTip';
//   import { WarnTriangle, ErrorTriangle } from '../../components/Icon/SwapRefresh';
//   // import ReactModal from 'react-modal';
//   // import Modal from 'react-modal';
//   // import { Card } from '../../components/Card';
//   // import { isMobile, useMobile } from '../../utils/device';
//   // import { ModalClose } from '../../components/icon';
//   import BigNumber from 'bignumber.js';
//   import {
//     AutoRouterText,
//     OneParallelRoute,
//     RouterIcon,
//     SmartRouteV2,
//   } from '../../components/SwapRoutes';
  
//   import { EstimateSwapView, PoolMode, swap } from '../../services/swap';
//   import { QuestionTip } from '../../components/TipWrapper';
//   import { senderWallet, WalletContext } from '../../utils/wallets-integration';
//   import { SwapArrow, SwapExchange } from '../Icon/Arrows';
//   import { getPoolAllocationPercents, percentLess } from '../../utils/numbers';
//   import { DoubleCheckModal } from '../../components/SwapDoubleCheck';
//   import { getTokenPriceList } from '../../services/indexer';
//   import { SWAP_MODE } from '../../pages/SwapPage';
//   import {
//     isStableToken,
//     STABLE_TOKEN_USN_IDS,
//     USD_CLASS_STABLE_TOKEN_IDS,
//   } from '../../services/near';
//   // import TokenReserves from '../stableswap/TokenReserves';
//   import { unwrapNear, WRAP_NEAR_CONTRACT_ID } from '../../services/wrap-near';
//   import getConfig, { getExtraStablePoolConfig } from '../../services/config';
//   import {
//     NEAR_CLASS_STABLE_TOKEN_IDS,
//     BTC_CLASS_STABLE_TOKEN_IDS,
//   } from '../../services/near';

// import { useSolana } from '@saberhq/use-solana'
// import { Currency, CurrencyAmount, Fraction, Token, TradeType } from '@cykura/sdk-core'
// import { Trade as V3Trade } from '@cykura/sdk'
// import { AdvancedSwapDetails } from 'components/swap/AdvancedSwapDetails'
// import { MouseoverTooltipContent } from 'components/Tooltip'
// import useDebounce from 'hooks/useDebounce'
// import useVerifyATA from 'hooks/useVerifyATA'
// import JSBI from 'jsbi'
// import { ArrowDown, Info } from 'react-feather'
// import ReactGA from 'react-ga'
// import { RouteComponentProps } from 'react-router-dom'
// import { Text } from 'rebass'
// import styled, { ThemeContext } from 'styled-components/macro'
// import AddressInputPanel from '../../components/AddressInputPanel'
// import { ButtonError, ButtonGray, ButtonLight, ButtonPrimary } from '../../components/Button'
// import { GreyCard } from '../../components/Card'
// import { AutoColumn } from '../../components/Column'
// import CurrencyInputPanel from '../../components/CurrencyInputPanel'
// import Row, { AutoRow, RowFixed } from '../../components/Row'
// import confirmPriceImpactWithoutFee from '../../components/swap/confirmPriceImpactWithoutFee'
// import ConfirmSwapModal from '../../components/swap/ConfirmSwapModal'
// import { ArrowWrapper, Dots, SwapCallbackError, Wrapper } from '../../components/swap/styleds'
// import SwapHeader from '../../components/swap/SwapHeader'
// import TradePrice from '../../components/swap/TradePrice'
// import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
// import { useCurrency } from '../../hooks/Tokens'
// import { V3TradeState } from '../../hooks/useBestV3Trade'
// import { useSwapCallback } from '../../hooks/useSwapCallback'
// import { useUSDTValue } from '../../hooks/useUSDTPrice'
// import { useActiveWeb3ReactSol } from '../../hooks/web3'
// import { Field } from '../../state/swap/actions'
// import {
//   useDefaultsFromURLSearch,
//   useDerivedSwapInfo,
//   useSwapActionHandlers,
//   useSwapState,
// } from '../../state/swap/hooks'
// import { useExpertModeManager, useUserSingleHopOnly } from '../../state/user/hooks'
// import { LinkStyledButton, TYPE } from '../../theme'
// import { computeFiatValuePriceImpact } from '../../utils/computeFiatValuePriceImpact'
// import { maxAmountSpend } from '../../utils/maxAmountSpend'
// import { warningSeverity } from '../../utils/prices'
// import { wallet } from '../../services/near';
// import { ConnectToNearBtn } from '../../components/Button';
// import AppBody from '../AppBody'
  
//   const SWAP_IN_KEY = 'REF_FI_SWAP_IN';
//   const SWAP_OUT_KEY = 'REF_FI_SWAP_OUT';
  
//   const SWAP_SLIPPAGE_KEY = 'REF_FI_SLIPPAGE_VALUE';
  
//   const SWAP_SLIPPAGE_KEY_STABLE = 'REF_FI_SLIPPAGE_VALUE_STABLE';
  
//   export const SWAP_USE_NEAR_BALANCE_KEY = 'REF_FI_USE_NEAR_BALANCE_VALUE';
//   const TOKEN_URL_SEPARATOR = '|';
  
//   export const isSameStableClass = (token1: string, token2: string) => {
//     const USDTokenList = USD_CLASS_STABLE_TOKEN_IDS;
  
//     const BTCTokenList = BTC_CLASS_STABLE_TOKEN_IDS;
  
//     const NEARTokenList = NEAR_CLASS_STABLE_TOKEN_IDS;
//     return (
//       (USDTokenList.includes(token1) && USDTokenList.includes(token2)) ||
//       (BTCTokenList.includes(token1) && BTCTokenList.includes(token2)) ||
//       (NEARTokenList.includes(token1) && NEARTokenList.includes(token2))
//     );
//   };
  
//   export const SUPPORT_LEDGER_KEY = 'REF_FI_SUPPORT_LEDGER';
  
//   export const unWrapTokenId = (id: string) => {
//     if (id === WRAP_NEAR_CONTRACT_ID) {
//       return 'near';
//     } else return id;
//   };
  
//   export const wrapTokenId = (id: string) => {
//     if (id === 'near') {
//       return WRAP_NEAR_CONTRACT_ID;
//     } else return id;
//   };
  
//   export function SwapDetail({
//     title,
//     value,
//   }: {
//     title: string;
//     value: string | JSX.Element;
//   }) {
//     return (
//       <section className="grid grid-cols-12 py-1 text-xs">
//         <p className="text-primaryText text-left col-span-6">{title}</p>
//         <p className="text-right text-white col-span-6">{value}</p>
//       </section>
//     );
//   }
  
//   export function SwapRateDetail({
//     title,
//     value,
//     subTitle,
//     from,
//     to,
//     tokenIn,
//     tokenOut,
//     fee,
//   }: {
//     fee: number;
//     title: string;
//     value: string;
//     from: string;
//     to: string;
//     subTitle?: string;
//     tokenIn: TokenMetadata;
//     tokenOut: TokenMetadata;
//   }) {
//     const [newValue, setNewValue] = useState<string>('');
//     const [isRevert, setIsRevert] = useState<boolean>(false);
  
//     const exchangeRageValue = useMemo(() => {
//       const fromNow = isRevert ? from : to;
//       const toNow = isRevert ? to : from;
//       if (ONLY_ZEROS.test(fromNow)) return '-';
  
//       return calculateExchangeRate(fee, fromNow, toNow);
//     }, [isRevert, to]);
  
//     useEffect(() => {
//       setNewValue(value);
//     }, [value]);
  
//     useEffect(() => {
//       setNewValue(
//         `1 ${toRealSymbol(
//           isRevert ? tokenIn.symbol : tokenOut.symbol
//         )} ≈ ${exchangeRageValue} ${toRealSymbol(
//           isRevert ? tokenOut.symbol : tokenIn.symbol
//         )}`
//       );
//     }, [isRevert, exchangeRageValue]);
  
//     function switchSwapRate() {
//       setIsRevert(!isRevert);
//     }
  
//     return (
//       <section className="grid grid-cols-12 py-1 text-xs">
//         <p className="text-primaryText text-left flex xs:flex-col md:flex-col col-span-4 whitespace-nowrap">
//           <label className="mr-1">{title}</label>
//           {subTitle ? <label>{subTitle}</label> : null}
//         </p>
//         <p
//           className="flex justify-end text-white cursor-pointer text-right col-span-8"
//           onClick={switchSwapRate}
//         >
//           <span className="mr-2" style={{ marginTop: '0.1rem' }}>
//             <FaExchangeAlt color="#00C6A2" />
//           </span>
//           <span className="font-sans">{newValue}</span>
//         </p>
//       </section>
//     );
//   }
  
//   export function SmartRoutesV2Detail({
//     swapsTodo,
//   }: {
//     swapsTodo: EstimateSwapView[];
//   }) {
//     const tokensPerRoute = swapsTodo
//       .filter((swap) => swap.inputToken == swap.routeInputToken)
//       .map((swap) => swap.tokens);
  
//     const identicalRoutes = separateRoutes(
//       swapsTodo,
//       swapsTodo[swapsTodo.length - 1].outputToken as any
//     );
  
//     const pools = identicalRoutes.map((r) => r[0]).map((hub) => hub.pool);
  
//     const percents = useMemo(() => {
//       return getPoolAllocationPercents(pools);
//     }, [identicalRoutes, pools]);
  
//     return (
//       <section className="md:flex lg:flex py-1 text-xs items-center md:justify-between lg:justify-between">
//         <div className="text-primaryText text-left self-start">
//           <div className="inline-flex items-center">
//             <RouterIcon />
//             <AutoRouterText />
//             <QuestionTip id="optimal_path_found_by_our_solution" width="w-56" />
//           </div>
//         </div>
  
//         <div className="text-right text-white col-span-7 xs:mt-2 md:mt-2 self-start">
//           {tokensPerRoute.map((tokens, index) => (
//             <div key={index} className="mb-2 md:w-smartRoute lg:w-smartRoute">
//               <div className="text-right text-white col-span-6 xs:mt-2 md:mt-2">
//                 {
//                   <SmartRouteV2
//                     tokens={tokens as any}
//                     p={percents[index]}
//                     pools={identicalRoutes[index].map((hub) => hub.pool)}
//                   />
//                 }
//               </div>
//             </div>
//           ))}
//         </div>
//       </section>
//     );
//   }
  
//   export function ParallelSwapRoutesDetail({
//     pools,
//     tokenIn,
//     tokenOut,
//   }: {
//     pools: Pool[];
//     tokenIn: TokenMetadata;
//     tokenOut: TokenMetadata;
//   }) {
//     const percents = useMemo(() => {
//       return getPoolAllocationPercents(pools);
//     }, [pools]);
  
//     return (
//       <section className="md:grid lg:grid grid-cols-12 py-1 text-xs">
//         <div className="text-primaryText text-left col-span-5">
//           <div className="inline-flex items-center">
//             <RouterIcon />
//             <AutoRouterText />
//             <QuestionTip id="optimal_path_found_by_our_solution" width="w-56" />
//           </div>
//         </div>
  
//         <div className="text-right text-white col-span-7 xs:mt-2 md:mt-2">
//           {pools.map((pool, i) => {
//             return (
//               <div className="mb-2" key={pool.id}>
//                 <OneParallelRoute
//                   tokenIn={tokenIn}
//                   tokenOut={tokenOut}
//                   poolId={pool.id}
//                   p={percents[i]}
//                   fee={pool.fee}
//                 />
//               </div>
//             );
//           })}
//         </div>
//       </section>
//     );
//   }
  
//   export function SmartRoutesDetail({
//     swapsTodo,
//   }: {
//     swapsTodo: EstimateSwapView[];
//   }) {
//     return (
//       <section className="md:flex lg:flex py-1 text-xs items-center md:justify-between lg:justify-between">
//         <div className="text-primaryText text-left ">
//           <div className="inline-flex items-center">
//             <RouterIcon />
//             <AutoRouterText />
//             <QuestionTip id="optimal_path_found_by_our_solution" width="w-56" />
//           </div>
//         </div>
  
//         <div className="text-right text-white col-span-6 xs:mt-2">
//           {
//             <SmartRouteV2
//               tokens={swapsTodo[0].tokens as any}
//               p="100"
//               pools={swapsTodo.map((swapTodo) => swapTodo.pool)}
//             />
//           }
//         </div>
//       </section>
//     );
//   }
  
//   export const GetPriceImpact = (
//     value: string,
//     tokenIn?: TokenMetadata,
//     tokenInAmount?: string
//   ) => {
//     const textColor =
//       Number(value) <= 1
//         ? 'text-greenLight'
//         : 1 < Number(value) && Number(value) <= 2
//         ? 'text-warn'
//         : 'text-error';
  
//     const displayValue = scientificNotationToString(
//       multiply(tokenInAmount as any, divide(value, '100'))
//     );
  
//     const tokenInInfo =
//       Number(displayValue) <= 0
//         ? ` / 0 ${toRealSymbol((tokenIn as any).symbol)}`
//         : ` / -${toInternationalCurrencySystemLongString(displayValue, 3)} ${
//             (tokenIn as any).symbol
//           }`;
  
//     if (Number(value) < 0.01)
//       return (
//         <span className="text-greenLight">
//           {`< -0.01%`}
//           {tokenInInfo}
//         </span>
//       );
  
//     if (Number(value) > 1000)
//       return (
//         <span className="text-error">
//           {`< -1000%`}
//           {tokenInInfo}
//         </span>
//       );
  
//     return (
//       <span className={`${textColor} font-sans`}>
//         {`≈ -${toPrecision(value, 2)}%`}
//         {tokenInInfo}
//       </span>
//     );
//   };
  
//   export const getPriceImpactTipType = (value: string) => {
//     const reault =
//       1 < Number(value) && Number(value) <= 2 ? (
//         <WarnTriangle></WarnTriangle>
//       ) : Number(value) > 2 && Number(value) != Infinity ? (
//         <ErrorTriangle></ErrorTriangle>
//       ) : null;
//     return reault;
//   };
  
//   export const PriceImpactWarning = ({ value }: { value: string }) => {
//     return (
//       <span className="">
//         <span className="rounded-full bg-acccountTab text-error px-2 py-0.5">
//           <FormattedMessage
//             id="more_expensive_than_best_rate_zh_cn"
//             defaultMessage=" "
//           />{' '}
//           {Number(value) > 1000 ? '> 1000' : toPrecision(value, 2)}
//           {'% '}
//           <FormattedMessage
//             id="more_expensive_than_best_rate_en"
//             defaultMessage=" "
//           />
//         </span>
//       </span>
//     );
//   };
  
//   function DetailView({
//     pools,
//     tokenIn,
//     tokenOut,
//     from,
//     to,
//     minAmountOut,
//     isParallelSwap,
//     fee,
//     swapsTodo,
//     priceImpact,
//     swapMode,
//   }: {
//     pools: Pool[];
//     tokenIn: TokenMetadata;
//     tokenOut: TokenMetadata;
//     from: string;
//     to: string;
//     minAmountOut: string;
//     isParallelSwap?: boolean;
//     fee?: number;
//     swapsTodo?: EstimateSwapView[];
//     priceImpact?: string;
//     swapMode?: SWAP_MODE;
//   }) {
//     const intl = useIntl();
//     const [showDetails, setShowDetails] = useState<boolean>(false);
  
//     const minAmountOutValue = useMemo(() => {
//       if (!minAmountOut) return '0';
//       else return toPrecision(minAmountOut, 8, true);
//     }, [minAmountOut]);
  
//     const exchangeRateValue = useMemo(() => {
//       if (!from || ONLY_ZEROS.test(to)) return '-';
//       else return calculateExchangeRate(fee as any, to, from);
//     }, [to]);
  
//     useEffect(() => {
//       if (Number(priceImpact) > 1) {
//         setShowDetails(true);
//       }
//     }, [priceImpact]);
  
//     useEffect(() => {
//       if (swapsTodo && swapsTodo.length > 1) {
//         setShowDetails(true);
//       }
//     }, [swapsTodo]);
  
//     const priceImpactDisplay = useMemo(() => {
//       if (!priceImpact || !tokenIn || !from) return null;
//       return GetPriceImpact(priceImpact, tokenIn, from);
//     }, [to, priceImpact]);
  
//     const poolFeeDisplay = useMemo(() => {
//       if (!fee || !from || !tokenIn) return null;
  
//       return `${toPrecision(
//         calculateFeePercent(fee).toString(),
//         2
//       )}% / ${calculateFeeCharge(fee, from)} ${toRealSymbol(tokenIn.symbol)}`;
//     }, [to]);
  
//     if (!pools || ONLY_ZEROS.test(from) || !to || tokenIn.id === tokenOut.id)
//       return null;
  
//     return (
//       <div className="mt-8">
//         <div className="flex justify-center">
//           <div
//             className="flex items-center text-white cursor-pointer"
//             onClick={() => {
//               setShowDetails(!showDetails);
//             }}
//           >
//             <label className="mr-2">{getPriceImpactTipType(priceImpact as any)}</label>
//             <p className="block text-xs">
//               <FormattedMessage id="details" defaultMessage="Details" />
//             </p>
//             <div className="pl-1 text-sm">
//               {showDetails ? <FaAngleUp /> : <FaAngleDown />}
//             </div>
//           </div>
//         </div>
//         <div className={showDetails ? '' : 'hidden'}>
//           <SwapDetail
//             title={intl.formatMessage({ id: 'minimum_received' })}
//             value={<span>{toPrecision(minAmountOutValue, 8)}</span>}
//           />
//           <SwapRateDetail
//             title={intl.formatMessage({ id: 'swap_rate' })}
//             value={`1 ${toRealSymbol(
//               tokenOut.symbol
//             )} ≈ ${exchangeRateValue} ${toRealSymbol(tokenIn.symbol)}`}
//             from={from}
//             to={to}
//             tokenIn={tokenIn}
//             tokenOut={tokenOut}
//             fee={fee as any}
//           />
//           {Number(priceImpact) > 2 && (
//             <div className="py-1 text-xs text-right">
//               <PriceImpactWarning value={priceImpact as any} />
//             </div>
//           )}
//           <SwapDetail
//             title={intl.formatMessage({ id: 'price_impact' })}
//             value={!to || to === '0' ? '-' : priceImpactDisplay as any}
//           />
//           <SwapDetail
//             title={intl.formatMessage({ id: 'pool_fee' })}
//             value={poolFeeDisplay as any}
//           />
  
//           {isParallelSwap && swapsTodo && swapsTodo.length > 1 && (
//             <ParallelSwapRoutesDetail
//               tokenIn={tokenIn}
//               tokenOut={tokenOut}
//               pools={pools}
//             />
//           )}
  
//           {(swapsTodo as any)[0].status === PoolMode.SMART && (
//             <SmartRoutesDetail swapsTodo={swapsTodo as any} />
//           )}
//           {!isParallelSwap &&
//             (swapsTodo as any).every((e: any) => e.status !== PoolMode.SMART) &&
//             pools.length > 1 && <SmartRoutesV2Detail swapsTodo={swapsTodo as any} />}
//         </div>
//       </div>
//     );
//   }
  
//   export default function SwapCard(props: {
//     allTokens: TokenMetadata[];
//     swapMode: SWAP_MODE;
//     stablePools: Pool[];
//     tokenInAmount: string;
//     setTokenInAmount: (value: string) => void;
//   }) {
//     const { NEARXIDS, STNEARIDS } = getExtraStablePoolConfig();
//     const { REF_TOKEN_ID } = getConfig();
//     getConfig();
//     const reserveTypeStorageKey = 'REF_FI_RESERVE_TYPE';
  
//     const { allTokens, swapMode, stablePools, tokenInAmount, setTokenInAmount } =
//       props;
//     const [tokenIn, setTokenIn] = useState<TokenMetadata>();
//     const [tokenOut, setTokenOut] = useState<TokenMetadata>();
//     const [doubleCheckOpen, setDoubleCheckOpen] = useState<boolean>(false);
  
//     const [reservesType, setReservesType] = useState<STABLE_POOL_TYPE>(
//       STABLE_POOL_TYPE[localStorage.getItem(reserveTypeStorageKey) as any] ||
//         STABLE_POOL_TYPE.USD
//     );
  
//     const [supportLedger, setSupportLedger] = useState(
//       localStorage.getItem(SUPPORT_LEDGER_KEY) ? true : false
//     );
  
//     const [useNearBalance, setUseNearBalance] = useState<boolean>(true);
  
//     const { globalState } = useContext(WalletContext) as any;
//     const isSignedIn = globalState.isSignedIn;
  
//     const [tokenInBalanceFromNear, setTokenInBalanceFromNear] =
//       useState<string>();
//     const [tokenOutBalanceFromNear, setTokenOutBalanceFromNear] =
//       useState<string>();
  
//     const [reEstimateTrigger, setReEstimateTrigger] = useState(false);
  
//     const [loadingData, setLoadingData] = useState<boolean>(false);
//     const [loadingTrigger, setLoadingTrigger] = useState<boolean>(true);
//     const [loadingPause, setLoadingPause] = useState<boolean>(false);
//     const [showSwapLoading, setShowSwapLoading] = useState<boolean>(false);
  
//     const intl = useIntl();
//     const location = useLocation();
//     const history = useHistory();
  
//     const balances = useTokenBalances();
//     const [urlTokenIn, urlTokenOut, urlSlippageTolerance] = decodeURIComponent(
//       location.hash.slice(1)
//     ).split(TOKEN_URL_SEPARATOR);
  
//     const nearBalance = useDepositableBalance('NEAR');
  
//     const [slippageToleranceNormal, setSlippageToleranceNormal] =
//       useState<number>(
//         Number(localStorage.getItem(SWAP_SLIPPAGE_KEY) || urlSlippageTolerance) ||
//           0.5
//       );
  
//     const [slippageToleranceStable, setSlippageToleranceStable] =
//       useState<number>(
//         Number(localStorage.getItem(SWAP_SLIPPAGE_KEY_STABLE)) || 0.5
//       );
  
//     const [tokenPriceList, setTokenPriceList] = useState<Record<string, any>>({});
  
//     useEffect(() => {
//       getTokenPriceList().then(setTokenPriceList);
//     }, []);
  
//     useEffect(() => {
//       if (!tokenIn || !tokenOut) return;
//       if (
//         BTC_CLASS_STABLE_TOKEN_IDS.includes(tokenIn.id) &&
//         BTC_CLASS_STABLE_TOKEN_IDS.includes(tokenOut.id)
//       ) {
//         setReservesType(STABLE_POOL_TYPE.BTC);
//         localStorage.setItem(reserveTypeStorageKey, STABLE_POOL_TYPE.BTC);
//       } else if (
//         NEAR_CLASS_STABLE_TOKEN_IDS.includes(tokenIn.id) &&
//         NEAR_CLASS_STABLE_TOKEN_IDS.includes(tokenOut.id)
//       ) {
//         setReservesType(STABLE_POOL_TYPE.NEAR);
//         localStorage.setItem(reserveTypeStorageKey, STABLE_POOL_TYPE.NEAR);
//       } else {
//         setReservesType(STABLE_POOL_TYPE.USD);
//         localStorage.setItem(reserveTypeStorageKey, STABLE_POOL_TYPE.USD);
//       }
//       // todo
//       history.replace(`#${tokenIn.id}${TOKEN_URL_SEPARATOR}${tokenOut.id}`);
  
//       localStorage.setItem(SWAP_IN_KEY, tokenIn.id);
//       localStorage.setItem(SWAP_OUT_KEY, tokenOut.id);
//     }, [tokenIn?.id, tokenOut?.id]);
  
//     useEffect(() => {
//       if (allTokens) {
//         // todo
//         let rememberedIn =
//           wrapTokenId(urlTokenIn) || localStorage.getItem(SWAP_IN_KEY);
//         let rememberedOut =
//           wrapTokenId(urlTokenOut) || localStorage.getItem(SWAP_OUT_KEY);
//         if (swapMode === SWAP_MODE.NORMAL) {
//           if (rememberedIn == NEARXIDS[0]) {
//             rememberedIn = REF_TOKEN_ID;
//           }
//           if (rememberedOut == NEARXIDS[0]) {
//             rememberedOut = REF_TOKEN_ID;
//           }
//           const candTokenIn =
//             allTokens.find((token) => token.id === rememberedIn) || allTokens[0];
  
//           const candTokenOut =
//             allTokens.find((token) => token.id === rememberedOut) || allTokens[1];
//           setTokenIn(candTokenIn);
//           setTokenOut(candTokenOut);
  
//           if (
//             tokenOut?.id === candTokenOut?.id &&
//             tokenIn?.id === candTokenIn?.id
//           )
//             setReEstimateTrigger(!reEstimateTrigger);
//         } else if (swapMode === SWAP_MODE.STABLE) {
//           let candTokenIn: TokenMetadata;
//           let candTokenOut: TokenMetadata;
//           if (rememberedIn == NEARXIDS[0]) {
//             rememberedIn = STNEARIDS[0];
//           }
//           if (rememberedOut == NEARXIDS[0]) {
//             rememberedOut = STNEARIDS[0];
//           }
//           if (
//             rememberedIn &&
//             rememberedOut &&
//             isSameStableClass(rememberedIn, rememberedOut)
//           ) {
//             candTokenIn = allTokens.find((token) => token.id === rememberedIn) as any;
//             candTokenOut = allTokens.find((token) => token.id === rememberedOut) as any;
//           } else {
//             const USDTokenList = new Array(
//               ...new Set(
//                 STABLE_TOKEN_USN_IDS.concat(STABLE_TOKEN_IDS).concat(CUSDIDS)
//               )
//             );
  
//             candTokenIn = allTokens.find((token) => token.id === USDTokenList[0]) as any;
//             candTokenOut = allTokens.find(
//               (token) => token.id === USDTokenList[1]
//             ) as any;
//             setTokenInAmount('1');
//           }
  
//           setTokenIn(candTokenIn);
  
//           setTokenOut(candTokenOut);
  
//           if (
//             tokenOut?.id === candTokenOut?.id &&
//             tokenIn?.id === candTokenIn?.id
//           )
//             setReEstimateTrigger(!reEstimateTrigger);
//         }
//       }
//     }, [allTokens, swapMode]);
  
//     useEffect(() => {
//       if (useNearBalance) {
//         if (tokenIn) {
//           const tokenInId = tokenIn.id;
//           if (tokenInId) {
//             if (isSignedIn) {
//               ftGetBalance(tokenInId).then((available: string) =>
//                 setTokenInBalanceFromNear(
//                   toReadableNumber(
//                     tokenIn?.decimals,
//                     tokenIn.id === WRAP_NEAR_CONTRACT_ID ? nearBalance : available
//                   )
//                 )
//               );
//             }
//           }
//         }
//         if (tokenOut) {
//           const tokenOutId = tokenOut.id;
//           if (tokenOutId) {
//             if (isSignedIn) {
//               ftGetBalance(tokenOutId).then((available: string) =>
//                 setTokenOutBalanceFromNear(
//                   toReadableNumber(
//                     tokenOut?.decimals,
//                     tokenOut.id === WRAP_NEAR_CONTRACT_ID
//                       ? nearBalance
//                       : available
//                   )
//                 )
//               );
//             }
//           }
//         }
//       }
//     }, [tokenIn, tokenOut, useNearBalance, isSignedIn, nearBalance]);
  
//     const slippageTolerance =
//       swapMode === SWAP_MODE.NORMAL
//         ? slippageToleranceNormal
//         : slippageToleranceStable;
  
//     const {
//       canSwap,
//       tokenOutAmount,
//       minAmountOut,
//       pools,
//       swapError,
//       makeSwap,
//       avgFee,
//       isParallelSwap,
//       swapsToDo,
//       setCanSwap,
//     } = useSwap({
//       tokenIn: tokenIn as any,
//       tokenInAmount,
//       tokenOut: tokenOut as any,
//       slippageTolerance,
//       setLoadingData,
//       loadingTrigger,
//       setLoadingTrigger,
//       loadingData,
//       loadingPause,
//       swapMode,
//       reEstimateTrigger,
//       supportLedger,
//     });
  
//     const priceImpactValueSmartRouting = useMemo(() => {
//       try {
//         if (swapsToDo?.length === 2 && swapsToDo[0].status === PoolMode.SMART) {
//           return calculateSmartRoutingPriceImpact(
//             tokenInAmount,
//             swapsToDo,
//             tokenIn as any,
//             swapsToDo[1].token as any,
//             tokenOut as any
//           );
//         } else if (
//           swapsToDo?.length === 1 &&
//           swapsToDo[0].status === PoolMode.STABLE
//         ) {
//           return '0'
//           // return calcStableSwapPriceImpact(
//           //   toReadableNumber(tokenIn.decimals, swapsToDo[0].totalInputAmount),
//           //   swapsToDo[0].noFeeAmountOut,
//           //   (
//           //     Number(swapsToDo[0].pool.rates[tokenOut.id]) /
//           //     Number(swapsToDo[0].pool.rates[tokenIn.id])
//           //   ).toString()
//           // );
//         } else return '0';
//       } catch {
//         return '0';
//       }
//     }, [tokenOutAmount, swapsToDo]);
  
//     const priceImpactValueSmartRoutingV2 = useMemo(() => {
//       try {
//         const pi = calculateSmartRoutesV2PriceImpact(swapsToDo, (tokenOut as any).id);
  
//         return pi;
//       } catch {
//         return '0';
//       }
//     }, [tokenOutAmount, swapsToDo]);
  
//     let PriceImpactValue = '0';
  
//     try {
//       if (
//         (swapsToDo as any)[0].status === PoolMode.SMART ||
//         (swapsToDo as any)[0].status === PoolMode.STABLE
//       ) {
//         PriceImpactValue = priceImpactValueSmartRouting as any;
//       } else {
//         PriceImpactValue = priceImpactValueSmartRoutingV2;
//       }
//     } catch (error) {
//       PriceImpactValue = '0';
//     }
  
//     const showMaxButton = Boolean(maxInputAmount?.greaterThan(0) && !parsedAmounts[Field.INPUT]?.equalTo(maxInputAmount))

//     const tokenInMax = useNearBalance
//       ? tokenInBalanceFromNear || '0'
//       : toReadableNumber(tokenIn?.decimals as any, balances?.[tokenIn?.id as any]) || '0';
//     const tokenOutTotal = useNearBalance
//       ? tokenOutBalanceFromNear || '0'
//       : toReadableNumber(tokenOut?.decimals as any, balances?.[tokenOut?.id as any]) || '0';
  
//     const canSubmit = canSwap && (tokenInMax != '0' || !useNearBalance);
  
//     const handleSubmit = (event: React.FormEvent) => {
//       event.preventDefault();
  
//       const ifDoubleCheck =
//         new BigNumber(tokenInAmount).isLessThanOrEqualTo(
//           new BigNumber(tokenInMax)
//         ) && Number(PriceImpactValue) > 2;
  
//       if (ifDoubleCheck) setDoubleCheckOpen(true);
//       else makeSwap(useNearBalance);
//     };
  
//     return (
//       <>
//         <SwapFormWrap
//           supportLedger={supportLedger}
//           setSupportLedger={setSupportLedger}
//           useNearBalance={useNearBalance.toString()}
//           canSubmit={canSubmit}
//           slippageTolerance={slippageTolerance}
//           onChange={(slippage) => {
//             swapMode === SWAP_MODE.NORMAL
//               ? setSlippageToleranceNormal(slippage)
//               : setSlippageToleranceStable(slippage);
  
//             localStorage.setItem(
//               swapMode === SWAP_MODE.NORMAL
//                 ? SWAP_SLIPPAGE_KEY
//                 : SWAP_SLIPPAGE_KEY_STABLE,
//               slippage?.toString()
//             );
//           }}
//           bindUseBalance={(useNearBalance) => {
//             setUseNearBalance(useNearBalance);
//             localStorage.setItem(
//               SWAP_USE_NEAR_BALANCE_KEY,
//               useNearBalance.toString()
//             );
//           }}
//           showElseView={tokenInMax === '0' && !useNearBalance}
//           elseView={
//             <div className="flex justify-center">
//               {isSignedIn ? (
//                 <SubmitButton disabled={true} loading={showSwapLoading} />
//               ) : (
//                 <div className="mt-4 w-full">
//                   <ConnectToNearBtn />
//                 </div>
//               )}
//             </div>
//           }
//           swapMode={swapMode}
//           onSubmit={handleSubmit}
//           info={intl.formatMessage({ id: 'swapCopy' })}
//           title={'swap'}
//           loading={{
//             loadingData,
//             setLoadingData,
//             loadingTrigger,
//             setLoadingTrigger,
//             loadingPause,
//             setLoadingPause,
//             showSwapLoading,
//             setShowSwapLoading,
//           }}
//         >
//           <TokenAmount
//             forSwap
//             swapMode={swapMode}
//             amount={tokenInAmount}
//             total={tokenInMax}
//             max={tokenInMax}
//             tokens={allTokens}
//             selectedToken={tokenIn as any}
//             balances={balances}
//             onSelectToken={(token) => {
//               localStorage.setItem(SWAP_IN_KEY, token.id);
//               swapMode === SWAP_MODE.NORMAL &&
//                 history.replace(
//                   `#${unWrapTokenId(
//                     token.id
//                   )}${TOKEN_URL_SEPARATOR}${unWrapTokenId((tokenOut as any).id)}`
//                 );
//               setTokenIn(token);
//               setCanSwap(false);
//             }}
//             text={intl.formatMessage({ id: 'from' })}
//             useNearBalance={useNearBalance}
//             onChangeAmount={(amount) => {
//               setTokenInAmount(amount);
//             }}
//             tokenPriceList={tokenPriceList}
//             isError={tokenIn?.id === tokenOut?.id}
//             postSelected={tokenOut}
//             onSelectPost={(token) => {
//               setTokenOut(token);
//             }}
//           />
//           <div
//             className="flex items-center justify-center border-t mt-12"
//             style={{ borderColor: 'rgba(126, 138, 147, 0.3)' }}
//           >
//             <SwapExchange
//               onChange={() => {
//                 setTokenIn(tokenOut);
//                 localStorage.setItem(SWAP_IN_KEY, (tokenOut as any).id);
//                 setTokenOut(tokenIn);
//                 localStorage.setItem(SWAP_OUT_KEY, (tokenIn as any).id);
  
//                 setTokenInAmount(toPrecision('1', 6));
//                 localStorage.setItem(SWAP_IN_KEY, (tokenOut as any).id);
//                 localStorage.setItem(SWAP_OUT_KEY, (tokenIn as any).id);
//                 history.replace(
//                   `#${unWrapTokenId(
//                     (tokenOut as any).id
//                   )}${TOKEN_URL_SEPARATOR}${unWrapTokenId((tokenIn as any).id)}`
//                 );
//               }}
//             />
//           </div>
//           <TokenAmount
//             forSwap
//             swapMode={swapMode}
//             amount={toPrecision(tokenOutAmount, 8)}
//             total={tokenOutTotal}
//             tokens={allTokens}
//             selectedToken={tokenOut as any}
//             balances={balances}
//             preSelected={tokenIn}
//             text={intl.formatMessage({ id: 'to' })}
//             useNearBalance={useNearBalance}
//             onSelectToken={(token) => {
//               localStorage.setItem(SWAP_OUT_KEY, token.id);
//               swapMode === SWAP_MODE.NORMAL &&
//                 history.replace(
//                   `#${unWrapTokenId(
//                     (tokenIn as any).id
//                   )}${TOKEN_URL_SEPARATOR}${unWrapTokenId(token.id)}`
//                 );
//               setTokenOut(token);
//               setCanSwap(false);
//             }}
//             isError={tokenIn?.id === tokenOut?.id}
//             tokenPriceList={tokenPriceList}
//           />
//           <DetailView
//             pools={pools as any}
//             tokenIn={tokenIn as any}
//             tokenOut={tokenOut as any}
//             from={tokenInAmount}
//             to={tokenOutAmount}
//             minAmountOut={minAmountOut as any}
//             isParallelSwap={isParallelSwap}
//             fee={avgFee}
//             swapsTodo={swapsToDo}
//             priceImpact={PriceImpactValue}
//             swapMode={swapMode}
//           />
//           {swapError ? (
//             <div className="pb-2 relative -mb-5">
//               <Alert level="warn" message={swapError.message} />
//             </div>
//           ) : null}
//         </SwapFormWrap>
//         <DoubleCheckModal
//           isOpen={doubleCheckOpen}
//           onRequestClose={() => {
//             setDoubleCheckOpen(false);
//             setShowSwapLoading(false);
//             setLoadingPause(false);
//           }}
//           tokenIn={tokenIn as any}
//           tokenOut={tokenOut as any}
//           from={tokenInAmount}
//           onSwap={() => makeSwap(useNearBalance)}
//           priceImpactValue={PriceImpactValue}
//         />
  
//   <AppBody>
//         <SwapHeader allowedSlippage={allowedSlippage} />
//         <Wrapper id="swap-page">
//           <ConfirmSwapModal
//             isOpen={showConfirm}
//             trade={trade}
//             originalTrade={tradeToConfirm}
//             onAcceptChanges={handleAcceptChanges}
//             attemptingTxn={attemptingTxn}
//             txHash={txHash}
//             recipient={recipient}
//             allowedSlippage={allowedSlippage}
//             onConfirm={handleSwap}
//             swapErrorMessage={swapErrorMessage}
//             onDismiss={handleConfirmDismiss}
//           />

//           <AutoColumn gap={'md'}>
//             <div style={{ display: 'relative' }}>

//             <TokenAmount
//             forSwap
//             swapMode={swapMode}
//             amount={tokenInAmount}
//             total={tokenInMax}
//             max={tokenInMax}
//             tokens={allTokens}
//             selectedToken={tokenIn as any}
//             balances={balances}
//             onSelectToken={(token) => {
//               localStorage.setItem(SWAP_IN_KEY, token.id);
//               swapMode === SWAP_MODE.NORMAL &&
//                 history.replace(
//                   `#${unWrapTokenId(
//                     token.id
//                   )}${TOKEN_URL_SEPARATOR}${unWrapTokenId((tokenOut as any).id)}`
//                 );
//               setTokenIn(token);
//               setCanSwap(false);
//             }}
//             text={intl.formatMessage({ id: 'from' })}
//             useNearBalance={useNearBalance}
//             onChangeAmount={(amount) => {
//               setTokenInAmount(amount);
//             }}
//             tokenPriceList={tokenPriceList}
//             isError={tokenIn?.id === tokenOut?.id}
//             postSelected={tokenOut}
//             onSelectPost={(token) => {
//               setTokenOut(token);
//             }}
//           />
//               <CurrencyInputPanel
//                 label={independentField === Field.OUTPUT ? <span>From (at most)</span> : null}
//                 value={tokenInAmount}
//                 showMaxButton={showMaxButton}
//                 currency={tokenIn as any}
//                 onUserInput={setTokenInAmount}
//                 onMax={tokenInMax}
//                 fiatValue={undefined}
//                 onCurrencySelect={(token) => {
//                     localStorage.setItem(SWAP_IN_KEY, token.id);
//                     swapMode === SWAP_MODE.NORMAL &&
//                       history.replace(
//                         `#${unWrapTokenId(
//                           token.id
//                         )}${TOKEN_URL_SEPARATOR}${unWrapTokenId((tokenOut as any).id)}`
//                       );
//                     setTokenIn(token);
//                     setCanSwap(false);
//                   }}
//                 otherCurrency={allTokens}
//                 showCommonBases={true}
//                 id="swap-currency-input"
//               />
//               <ArrowWrapper clickable>
//                 <ArrowDown
//                   size="16"
//                   onClick={onSwitchTokens}
//                   color={currencies[Field.INPUT] && currencies[Field.OUTPUT] ? theme.text1 : theme.text3}
//                 />
//               </ArrowWrapper>
//               <CurrencyInputPanel
//                 value={formattedAmounts[Field.OUTPUT]}
//                 onUserInput={handleTypeOutput}
//                 label={independentField === Field.INPUT ? <span>To (at least)</span> : null}
//                 showMaxButton={false}
//                 hideBalance={false}
//                 fiatValue={fiatValueOutput ?? undefined}
//                 priceImpact={priceImpact}
//                 currency={currencies[Field.OUTPUT]}
//                 onCurrencySelect={handleOutputSelect}
//                 otherCurrency={currencies[Field.INPUT]}
//                 showCommonBases={true}
//                 id="swap-currency-output"
//               />
//             </div>

//             <Row style={{ justifyContent: !trade ? 'center' : 'space-between' }}>
//               {trade ? (
//                 <>
//                   <TradePrice
//                     price={trade.executionPrice}
//                     showInverted={showInverted}
//                     setShowInverted={setShowInverted}
//                   />
//                   <MouseoverTooltipContent
//                     content={<AdvancedSwapDetails trade={trade} allowedSlippage={allowedSlippage} />}
//                   >
//                     <StyledInfo />
//                   </MouseoverTooltipContent>
//                 </>
//               ) : null}
//             </Row>

//             <div>
//               {!connected ? (
//                 <ButtonLight onClick={() => { console.log("shit connect") }}>
//                   <span>Connect Wallet</span>
//                 </ButtonLight>
//               ) : routeNotFound && userHasSpecifiedInputOutput ? (
//                 <GreyCard style={{ textAlign: 'center' }}>
//                   <TYPE.main mb="4px">
//                     {v3TradeState === V3TradeState.LOADING ? (
//                       <Dots>
//                         <span>Loading</span>
//                       </Dots>
//                     ) : (
//                       // : singleHopOnly ? (
//                       //   <span>Insufficient liquidity for this trade. Try enabling multi-hop trades.</span>
//                       // )
//                       <span>Insufficient liquidity for this trade.</span>
//                     )}
//                   </TYPE.main>
//                 </GreyCard>
//               ) : (
//                 // ATA check and creation handled within the swap txn
//                 // : !haveAllATAs && !isValid ? (
//                 //   <ButtonError onClick={handleCreateATA}>
//                 //     <Text fontSize={20} fontWeight={500}>
//                 //       Create Accounts
//                 //     </Text>
//                 //   </ButtonError>
//                 // ) :
//                 <ButtonError
//                   onClick={() => {
//                     // handleSwap()
//                     setSwapState({
//                       tradeToConfirm: trade,
//                       attemptingTxn: false,
//                       swapErrorMessage: undefined,
//                       showConfirm: true,
//                       txHash: undefined,
//                     })
//                     // if (isExpertMode) {
//                     //   handleSwap()
//                     // } else {
//                     //   console.log('setting swap state')
//                     //   // setSwapState({
//                     //   //   tradeToConfirm: trade,
//                     //   //   attemptingTxn: false,
//                     //   //   swapErrorMessage: undefined,
//                     //   //   showConfirm: true,
//                     //   //   txHash: undefined,
//                     //   // })
//                     // }
//                   }}
//                   id="swap-button"
//                   disabled={!isValid || priceImpactTooHigh || !!swapCallbackError}
//                   error={isValid && priceImpactSeverity > 2 && !swapCallbackError}
//                 >
//                   <Text fontSize={20} fontWeight={500}>
//                     {swapInputError ? (
//                       swapInputError
//                     ) : priceImpactTooHigh ? (
//                       <span>Price Impact Too High</span>
//                     ) : priceImpactSeverity > 2 ? (
//                       <span>Swap Anyway</span>
//                     ) : (
//                       <span>Swap</span>
//                     )}
//                   </Text>
//                 </ButtonError>
//               )}
//               {isExpertMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
//             </div>
//           </AutoColumn>
//         </Wrapper>
//       </AppBody>
//       </>
//     );
//   }
  