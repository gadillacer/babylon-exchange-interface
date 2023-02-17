import React, {
useContext,
useState,
useEffect,
useMemo,
useRef,
useCallback,
} from 'react';
// import { matchPath } from 'react-router';
// import { Context } from '~components/wrapper';
import getConfig from '../../services/config';
// import ReactTooltip from 'react-tooltip';
import {
    Near
} from '../../components/Icon/Near';
// import { SmallWallet } from '~components/icon/SmallWallet';
import {
    AccountIcon,
    ActivityIcon,
    WalletIcon,
    SignoutIcon,
    WNEARExchngeIcon,
} from '../../components/Icon/Common';
import { Link, useLocation, useHistory } from 'react-router-dom';
// import { NEARXIDS, wallet } from '~services/near';
import { Card } from '../../components/Card';

import { FormattedMessage, useIntl } from 'react-intl';
import { HiOutlineExternalLink } from 'react-icons/hi';
import { IoChevronBack, IoClose } from 'react-icons/io5';

import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
// import { useMenuItems } from '~utils/menu';
// import { MobileNavBar } from './MobileNav';
// import WrapNear from '~components/forms/WrapNear';
// import { WrapNearIcon } from './WrapNear';
// import { XrefIcon } from '~components/icon/Xref';
import {
    senderWallet,
    getCurrentWallet,
} from '../../utils/wallets-integration';
// import { WalletSelectorModal } from './WalletSelector';
import {
    WalletContext,
    getSenderWallet,
} from '../../utils/wallets-integration';
import {
    getAccountName,
    saveSenderLoginRes,
} from '../../utils/wallets-integration';
import { ftGetTokensMetadata } from '../../services/ft-contract';
import { useTokenBalances } from '../../state/token';
import { toReadableNumber } from '../../utils/numbers';
// import { FarmDot } from '../icon/FarmStamp';
// import {
//     ConnectDot,
//     AuroraIcon,
//     HasBalance,
//     CopyIcon,
// } from '../Icon/CrossSwapIcons';

//import { CopyToClipboard } from 'react-copy-to-clipboard';
import { isMobile, useMobile, useClientMobile } from '../../utils/device';
import { REF_FI_SWAP_SWAPPAGE_TAB_KEY } from '../../pages/SwapPage';

import {
useWalletSelector,
ACCOUNT_ID_KEY,
} from '../../contexts/WalletSelectorContext';

// import { Modal } from '~context/modal-ui/components/Modal';
// import { openTransak } from '../alert/Transak';
// import { BuyNearButton } from '../button/Button';

const config = getConfig();

export function AccountTipDownByAccountID({ show }: { show: boolean }) {
    return (
      <div className={`account-tip-popup ${show ? 'block' : 'hidden'} text-xs`}>
        <span>
          <em></em>
        </span>
        <FormattedMessage
          id="ref_account_tip_2"
          defaultMessage="You have token(s) in your REF Account"
        />
      </div>
    );
}

export function AccountEntry({
    setShowWalletSelector,
    showWalletSelector,
    hasBalanceOnRefAccount,
  }: {
    setShowWalletSelector: (show: boolean) => void;
    showWalletSelector: boolean;
    hasBalanceOnRefAccount: boolean;
  }) {
    const history = useHistory();
    const [hover, setHover] = useState(false);
  
    const { globalState } = useContext(WalletContext) as any;
    const { wallet } = getCurrentWallet();
  
    const [copyIconHover, setCopyIconHover] = useState<boolean>(false);
  
    const [showAccountTip, setShowAccountTip] = useState<boolean>(false);
  
    const [currentWalletName, setCurrentWalletName] = useState<string>();
  
    const [currentWalletIcon, setCurrentWalletIcon] = useState<string>();
  
    const { selector, modal, accounts, accountId, setAccountId } =
      useWalletSelector();
  
    const isSignedIn = globalState.isSignedIn;
  
    useEffect(() => {
      wallet.wallet().then((res) => {
        setCurrentWalletName(res.metadata.name);
        setCurrentWalletIcon(res.metadata.iconUrl);
      });
    }, [accountId]);
  
    useEffect(() => {
      setShowAccountTip(hasBalanceOnRefAccount);
    }, [hasBalanceOnRefAccount]);
  
    const location = useLocation();
  
    useEffect(() => {
      const timer = setTimeout(() => {
        setShowAccountTip(false);
      }, 4000);
  
      return () => clearTimeout(timer);
    }, [showAccountTip]);
  
    const signOut = async () => {
      const curWallet = await wallet.wallet();
  
      await curWallet.signOut();
  
      localStorage.removeItem(ACCOUNT_ID_KEY);
  
      window.location.assign('/');
    };
  
    const accountList = [
      {
        icon: <AccountIcon />,
        textId: 'your_assets',
        selected: location.pathname == '/account',
        click: () => {
          if (location.pathname == '/account') {
            localStorage.setItem(REF_FI_SWAP_SWAPPAGE_TAB_KEY, 'normal');
            window.location.reload();
          } else {
            history.push('/account?tab=ref');
          }
        },
      },
      {
        icon: <ActivityIcon />,
        textId: 'recent_activity',
        selected: location.pathname == '/recent',
        click: () => {
          history.push('/recent');
        },
      },
      {
        icon: <WalletIcon />,
        textId: 'go_to_near_wallet',
        // subIcon: <HiOutlineExternalLink />,
        click: () => {
          window.open(
            selector.store.getState().selectedWalletId === 'my-near-wallet'
              ? config.myNearWalletUrl
              : config.walletUrl,
            '_blank'
          );
        },
      },
    ];
  
    const isMobile = useClientMobile();
  
    return (
      <div className="bubble-box relative user text-xs text-center justify-end z-40 mr-3.5">
        {showAccountTip ? (
          <AccountTipDownByAccountID show={showAccountTip} />
        ) : null}
        <div
          className={`cursor-pointer font-bold items-center justify-end text-center overflow-visible relative py-5`}
          onMouseEnter={() => {
            setShowAccountTip(false);
            setHover(true);
          }}
          onMouseLeave={() => {
            setHover(false);
          }}
        >
          <div
            className={`inline-flex px-1 py-0.5 items-center justify-center rounded-full border border-gray-700 ${
              hover ? 'border-gradientFrom bg-opacity-0' : ''
            } ${
              isSignedIn
                ? 'bg-gray-700 text-white'
                : 'border border-gradientFrom text-gradientFrom'
            } pl-3 pr-3`}
          >
            <div className="pr-1">
              <Near color={isSignedIn ? 'white' : '#00c6a2'} />
            </div>
            <div className="overflow-ellipsis overflow-hidden whitespace-nowrap account-name">
              {isSignedIn ? (
                <span className="flex ml-1 items-center">
                  {getAccountName((wallet as any).getAccountId())}
                  {hasBalanceOnRefAccount ? (
                    <span className="ml-1.5">
                      {/* <FarmDot inFarm={hasBalanceOnRefAccount} /> */}
                    </span>
                  ) : null}
                  <FiChevronDown className="text-base ml-1" />
                </span>
              ) : (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // setShowWalletSelector(true);
                    modal.show();
  
                    setHover(false);
                  }}
                  type="button"
                >
                  <span className="ml-1 text-xs">
                    <FormattedMessage
                      id="connect_to_near"
                      defaultMessage="Connect to NEAR"
                    />
                  </span>
                </button>
              )}
            </div>
          </div>
          {isSignedIn && hover ? (
            <div className={`absolute top-14 pt-2 right-0 w-64 z-40`}>
              <Card
                className="menu-max-height bg-cardBg cursor-default shadow-4xl "
                width="w-72"
                padding="py-4"
                style={{
                  border: '1px solid #415462',
                }}
              >
                <div className="mx-7 flex justify-between items-start">
                  <div className="text-white text-lg text-left flex-col flex">
                    <span>{getAccountName((wallet as any).getAccountId())}</span>
  
                    <span className="flex items-center ">
                      <span className="mr-1">
                        {!currentWalletIcon ? (
                          <div className="w-3 h-3"></div>
                        ) : (
                          <img
                            src={currentWalletIcon}
                            className="w-3 h-3"
                            alt=""
                          />
                        )}
                      </span>
                      <span className="text-xs text-primaryText">
                        {currentWalletName || '-'}
                      </span>
                    </span>
                  </div>
  
                  <div className="flex items-center">
                    {/* <CopyToClipboard text={(wallet as any).getAccountId()}>
                      <div
                        className={` bg-opacity-20 rounded-lg flex items-center justify-center p-1.5 cursor-pointer`}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        onMouseEnter={() => {
                          !isMobile && setCopyIconHover(true);
                        }}
                        onMouseLeave={() => {
                          !isMobile && setCopyIconHover(false);
                        }}
                        onTouchStart={() => {
                          setCopyIconHover(true);
                        }}
                        onTouchEnd={() => {
                          setCopyIconHover(false);
                        }}
                      >
                        <CopyIcon
                          fillColor={copyIconHover ? '#4075FF' : '#7E8A93'}
                        />
                      </div>
                    </CopyToClipboard> */}
                    
  
                    <button
                      className="hover:text-gradientFrom text-primaryText ml-2"
                      onClick={() => {
                        window.open(
                          `https://${
                            getConfig().networkId === 'testnet' ? 'testnet.' : ''
                          }nearblocks.io/address/${(wallet as any).getAccountId()}#transaction`
                        );
                      }}
                    >
                      <HiOutlineExternalLink size={18} />
                    </button>
                  </div>
                </div>
  
                <div className="flex mx-7 my-3 items-center text-xs justify-center">
                  <button
                    className="text-BTCColor mr-2 w-1/2 py-1.5 border rounded-lg hover:border-transparent hover:bg-BTCColor hover:bg-opacity-20 border-BTCColor border-opacity-30"
                    onClick={() => {
                      signOut();
                    }}
                  >
                    <FormattedMessage
                      id="disconnect"
                      defaultMessage={'Disconnect'}
                    />
                  </button>
  
                  <button
                    className="text-gradientFrom ml-2 w-1/2 py-1.5 border rounded-lg hover:border-transparent hover:bg-gradientFrom hover:bg-opacity-20 border-gradientFrom border-opacity-30"
                    onClick={async () => {
                      modal.show();
                    }}
                  >
                    <FormattedMessage id="change" defaultMessage={'Change'} />
                  </button>
                </div>
  
                <div
                  className="my-3 mx-7 "
                  style={{
                    borderBottom: '1px solid rgba(126, 138, 147, 0.3)',
                  }}
                ></div>
  
                {accountList.map((item, index) => {
                  return (
                    <>
                      <div
                        onClick={item.click}
                        key={item.textId + index}
                        className={`flex items-center mx-3 text-sm cursor-pointer font-semibold py-4 pl-3 hover:text-white hover:bg-black rounded-lg hover:bg-opacity-10 ${
                          item.selected
                            ? 'text-white bg-black bg-opacity-10'
                            : 'text-primaryText'
                        }`}
                      >
                        <label className="w-9 text-left cursor-pointer">
                          {item.icon}
                        </label>
                        <label className="cursor-pointer text-base">
                          <FormattedMessage id={item.textId} />
                        </label>
                        <label htmlFor="" className="ml-1.5">
                          {item.textId === 'your_assets' &&
                          hasBalanceOnRefAccount ? (
                            null
                          ) : null}
                        </label>
                        {/* {item.subIcon ? (
                          <label className="text-lg ml-2">{item.subIcon}</label>
                        ) : null} */}
                      </div>
                      {hasBalanceOnRefAccount && item.textId === 'your_assets' ? (
                        <div
                          className="text-center py-0.5 font-normal bg-gradientFrom w-full cursor-pointer text-xs"
                          onClick={item.click}
                          style={{
                            color: '#001320',
                          }}
                        >
                          <FormattedMessage
                            id="ref_account_tip_2"
                            defaultMessage="You have token(s) in your REF Account"
                          />
                        </div>
                      ) : null}
                    </>
                  );
                })}
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    );
  }