import { createContext, useCallback, useContext } from 'react';
import { SnackbarProvider, useSnackbar } from 'notistack';
import { useIntl } from 'react-intl';
import * as Mui from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';

const MessageContext = createContext()

export const useMessage = () => useContext(MessageContext)

function MessageInnerProvider(props) {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const intl = useIntl()
  const wrapWeb3Request = useCallback((request) => {
    let key;
    const getAction = (hash) => (key) => <>
      {hash && <Mui.Button sx={{ fontWeight: 600 }} color="secondary" size="small" target="_blank" rel="noopener noreferrer" href={`https://hecoinfo.com/tx/${hash}`}>
        {intl.formatMessage({ defaultMessage: 'View' })}
      </Mui.Button>}
      <Mui.IconButton
        size="small"
        color="inherit"
        onClick={() => closeSnackbar(key)}
      >
        <CloseIcon fontSize="small" />
      </Mui.IconButton>
    </>
    request.on('transactionHash', (hash) => {
      key = enqueueSnackbar(intl.formatMessage({ defaultMessage: 'Tx: {hash} is pending.' }, {
        hash: `${hash.substr(0, 10)}...`
      }), {
        action: getAction(hash),
        variant: 'info',
        persist: true
      })
    }).on('receipt', (receipt) => {
      key && closeSnackbar(key)
      enqueueSnackbar(intl.formatMessage({ defaultMessage: 'Tx: {hash} has confirmed!' }, {
        hash: `${receipt.transactionHash.substr(0, 10)}...`
      }), {
        action: getAction(receipt.transactionHash),
        variant: 'success'
      })
    }).on('error', (error, receipt) => {
      key && closeSnackbar(key)
      enqueueSnackbar(receipt ? intl.formatMessage({ defaultMessage: 'Tx: {hash} has reverted! {message}' }, {
        hash: `${receipt.transactionHash.substr(0, 10)}...`,
        message: error.message
      }) : error.message, {
        action: getAction(receipt && receipt.transactionHash),
        variant: 'error'
      })
    })
  }, [intl, closeSnackbar, enqueueSnackbar])
  return (
    <MessageContext.Provider value={{ wrapWeb3Request }}>
      {props.children}
    </MessageContext.Provider>
  );
}

export function MessageProvider(props) {
  return (
    <SnackbarProvider
      style={{ marginTop: '6px', marginBottom: '6px', maxWidth: 500, pointerEvents: 'initial', flexWrap: 'nowrap' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <MessageInnerProvider>
        {props.children}
      </MessageInnerProvider>
    </SnackbarProvider>
  )
}
