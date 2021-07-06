import { useMemo } from 'react'
import { UseWalletProvider } from 'use-wallet'
import { IntlProvider } from 'react-intl'
import {
  HashRouter as Router
} from "react-router-dom";
import { TokenGraphProvider } from './TokenGraph';
import { ChainProvider } from './Chain'
import { TransactionSettingsProvider } from './TransactionSettings'
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import { MessageProvider } from './Message';
import * as Mui from '@material-ui/core';
import { useQuery } from './Router'

const theme = createTheme({
  components: {
    MuiTooltip: {
      defaultProps: {
        enterTouchDelay: 0,
        arrow: true
      },
      styleOverrides: {
        tooltip: {
          maxWidth: 200,
        },
      }
    },
    MuiContainer: {
      defaultProps: {
        disableGutters: true
      },
      styleOverrides: {
        root: {
          overflow: 'auto'
        }
      }
    }
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 576,
      md: 768,
      lg: 992,
      xl: 1200,
    },
  },
});

function MultiProvider(props) {
  const chainId = parseInt(useQuery('chainId', '256'))
  const lang = useQuery('lang')
  const locale = useMemo(() => lang || navigator.language, [lang])

  return (
    <ThemeProvider theme={theme}>
      <IntlProvider locale={locale} defaultLocale={locale}>
        <UseWalletProvider chainId={chainId}>
          <MessageProvider>
            <ChainProvider>
              <TokenGraphProvider>
                <TransactionSettingsProvider>
                  <Mui.CssBaseline />
                  {props.children}
                </TransactionSettingsProvider>
              </TokenGraphProvider>
            </ChainProvider>
          </MessageProvider>
        </UseWalletProvider>
      </IntlProvider>
    </ThemeProvider>
  )
}

export function Provider(props) {
  return (
    <Router>
      <MultiProvider>
        {props.children}
      </MultiProvider>
    </Router>
  )
}

export default Provider