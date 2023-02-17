import 'inter-ui';
import '@reach/dialog/styles.css';
import { StrictMode } from 'react';
import { WalletKitProvider } from "@gokiprotocol/walletkit";
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import App from './pages/App';
import store from './state';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import ApplicationUpdater from './state/application/updater';
import MulticallUpdater from './state/multicall/updater';
import LogsUpdater from './state/logs/updater';
import TransactionUpdater from './state/transactions/updater';
import UserUpdater from './state/user/updater';
import ThemeProvider, { ThemedGlobalStyle } from './theme';
import { SnackbarProvider } from 'notistack';
import GradientUpdater from './theme/BgGradient';
import { WalletSelectorContextProvider } from 'contexts/WalletSelectorContext';
import Wrapper from './components/Wrapper';

if (!!window.ethereum) {
  window.ethereum.autoRefreshOnNetworkChange = false;
}

ReactDOM.render(
  <StrictMode>
    <Provider store={store}>
      <Wrapper>
      <WalletSelectorContextProvider>
        <WalletKitProvider
        defaultNetwork="devnet"
        app={{
          name: "My App",
          icon: (
            <img
              src="https://goki.so/assets/android-chrome-256x256.png"
              alt="icon"
            />
          ),
        }}
        debugMode={true} // you may want to set this in REACT_APP_DEBUG_MODE
      >
            <HashRouter>
                <ThemeProvider>
                  <SnackbarProvider autoHideDuration={1500}>
                    <ThemedGlobalStyle />

                        <App />

                  </SnackbarProvider>
                </ThemeProvider>

            </HashRouter>
          </WalletKitProvider>
            </WalletSelectorContextProvider>
            </Wrapper>
    </Provider>

  </StrictMode>,
  document.getElementById('root')
);

serviceWorkerRegistration.unregister();
