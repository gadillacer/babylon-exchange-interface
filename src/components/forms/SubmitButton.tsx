import React, { useContext } from 'react';
// import { Near } from '../Icon';
// import { REF_FARM_CONTRACT_ID, wallet } from '../../services/near';
import { FormattedMessage } from 'react-intl';
import {
  ConnectToNearBtn,
  ButtonTextWrapper,
} from '../../components/Button';

// import { BeatLoading } from '../../components/Loading';
import {
  getCurrentWallet,
  WalletContext,
} from '../../utils/wallets-integration';

import { ButtonPrimary } from '../Button';

interface SubmitButtonProps {
  text?: string;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  info?: string | JSX.Element;
  label?: string;
  className?: string;
  loading?: boolean;
  signedInConfig?: boolean;
}

function SubmitButton({
  disabled,
  onClick,
  label,
  className,
  loading,
  signedInConfig,
}: SubmitButtonProps) {
  const { globalState } = useContext(WalletContext) as any;
  const isSignedIn = globalState.isSignedIn;

  return (
    <>
      {isSignedIn || signedInConfig ? (
        <ButtonPrimary
          type={onClick ? 'button' : 'submit'}
          disabled={disabled || loading}
          onClick={onClick}
        >
          {!label && (
            <h1 className="text-lg font-inter font-semibold">
              <ButtonTextWrapper
                loading={loading as any}
                Text={() => (
                  <FormattedMessage id="swap" defaultMessage="Swap" />
                )}
              />
            </h1>
          )}
          {label && (
            <h1 className="text-lg font-inter font-semibold">
              <ButtonTextWrapper
                loading={loading as any}
                Text={() => (
                  <FormattedMessage id={label} defaultMessage={label} />
                )}
              />
            </h1>
          )}
        </ButtonPrimary>
      ) : (
        <div className="mt-4 w-full">
          <ConnectToNearBtn />
        </div>
      )}
    </>
  );
}

export default SubmitButton;
