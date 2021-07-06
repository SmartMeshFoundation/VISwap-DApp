import { useEffect, useMemo, useReducer, useCallback, useRef } from 'react';
import { Link } from './Router';
import { useIntl } from 'react-intl';
import { useTokenGraph } from './TokenGraph';
import { useChain } from './Chain';
import TransactionSettings, { useTransactionSettings } from './TransactionSettings'
import { useWallet } from 'use-wallet';
import { BigNumber } from './utils';
import useContractChecker from './useContractChecker';
import * as Mui from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import InfoLine from './InfoLine';
import { useMessage } from './Message';
import { BN0 } from './utils'

const initialTrade = {
  amount: '',
  amount0: BN0,
  amount1: BN0
}

export default function Remove({ address }) {
  const chain = useChain()
  const wallet = useWallet()
  const intl = useIntl()
  const tokenGraph = useTokenGraph()
  const requestId = useRef(0)
  const { wrapWeb3Request } = useMessage()
  const theme = Mui.useTheme()
  const media = Mui.useMediaQuery(theme.breakpoints.up('lg'))
  const pair = useMemo(() => {
    const result = { ...tokenGraph.pairs[address] }
    result.token0 = { ...tokenGraph.tokens[result.token0], address: result.token0 }
    result.token1 = { ...tokenGraph.tokens[result.token1], address: result.token1 }
    return result
  }, [tokenGraph, address])
  const balance = useContractChecker({
    type: 'balance',
    id: address,
    decimals: pair.decimals
  })
  const allowance = useContractChecker({
    type: 'allowanceOfRouter',
    id: address,
    decimals: pair.decimals
  })
  const { getMinOutput, getDeadline } = useTransactionSettings()

  const removeLiquidity = useCallback((trade, send) => {
    const method = chain.contracts.router.methods.removeLiquidity(
      pair.token0.address,
      pair.token1.address,
      new BigNumber(trade.amount).shiftedBy(pair.decimals).toFixed(0),
      getMinOutput(trade.amount0).shiftedBy(pair.token0.decimals).toFixed(0),
      getMinOutput(trade.amount1).shiftedBy(pair.token1.decimals).toFixed(0),
      wallet.account,
      getDeadline()
    )
    if (send) {
      wrapWeb3Request(method.send({ from: wallet.account }))
    } else {
      return method.call({ from: wallet.account })
    }
  }, [chain, pair, getMinOutput, getDeadline, wallet.account, wrapWeb3Request])

  const reducer = useCallback((state, action) => {
    const newState = { ...state }
    switch (action.type) {
      case 'amount_changed':
        newState.amount = action.value
        console.log("amount_changed",newState.amount)
        break
      case 'amount_changed_callback':
        if (action.requestId !== requestId.current ||
          (newState.amount0.eq(action.amount0) && newState.amount1.eq(action.amount1))
        ) {
          return state
        }
        newState.amount0 = action.amount0
        newState.amount1 = action.amount1
        break
      default:
        throw new Error()
    }
    return newState
  }, [])
  const [trade, dispatch] = useReducer(reducer, initialTrade)
  const showInfo = useMemo(() =>
    balance && allowance && balance.gte(trade.amount) && allowance.gte(trade.amount),
    [balance, allowance, trade.amount]
  )

  useEffect(() => {
    const _requestId = requestId.current
    if (showInfo) {
      const check = () => {
        removeLiquidity(trade).then((value) =>
          dispatch({
            type: 'amount_changed_callback',
            amount0: new BigNumber(value.amountA).shiftedBy(- pair.token0.decimals),
            amount1: new BigNumber(value.amountB).shiftedBy(- pair.token1.decimals),
            requestId: _requestId
          })
        ).catch((error) =>
          dispatch({
            type: 'amount_changed_callback',
            error,
            amount0: initialTrade.amount0,
            amount1: initialTrade.amount1,
            requestId: _requestId
          })
        )
      }

      const timeoutId = setTimeout(check, 500)
      const id = setInterval(check, 5000)
      return () => {
        clearTimeout(timeoutId)
        clearInterval(id)
        requestId.current++
      }
    } else {
      dispatch({
        type: 'amount_changed_callback',
        amount0: initialTrade.amount0,
        amount1: initialTrade.amount1,
        requestId: _requestId
      })
      return () => { requestId.current++ }
    }
  }, [trade, pair, showInfo, removeLiquidity])

  let display;
  if (!parseFloat(trade.amount)) {
    display = {
      buttonText: intl.formatMessage({ defaultMessage: 'Pleace Enter Amount' }),
      buttonVariant: "contained",
      buttonDisabled: true,
    }
  } else if (!balance || !allowance) {
    display = {
      buttonText: intl.formatMessage({ defaultMessage: 'Loading...' }),
      buttonVariant: "contained",
      buttonDisabled: true,
    }
  } else if (balance.lt(trade.amount)) {
    display = {
      buttonText: intl.formatMessage({ defaultMessage: 'Insufficient Balance' }),
      buttonVariant: "contained",
      buttonDisabled: true,
    }
  } else if (allowance.lt(trade.amount)) {
    display = {
      buttonText: intl.formatMessage({ defaultMessage: 'Approve {token}' }, {
        token: `${pair.token0.displayName}/${pair.token1.displayName} LP`
      }),
      buttonVariant: "outlined",
      buttonOnClick: () => chain.approveToRouter(wallet.account, address)
    }
  } else {
    display = {
      buttonText: intl.formatMessage({ defaultMessage: 'Remove Liquidity' }),
      buttonVariant: "contained",
      buttonOnClick: () => removeLiquidity(trade, true)
    }
  }

  return (
    <>
      <Mui.DialogTitle disableTypography sx={{ position: 'relative' }}>
        <Mui.IconButton
          component={Link}
          to="/liquidity"
          sx={{
            position: 'absolute',
            left: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          {media ? <CloseIcon /> : <ArrowBackIcon />}
        </Mui.IconButton>
        <Mui.Typography variant="h6" component="div" sx={{ textAlign: 'center' }}>
          {intl.formatMessage({ defaultMessage: 'Remove Liquidity' })}
        </Mui.Typography>
        <Mui.Box
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <TransactionSettings />
        </Mui.Box>
      </Mui.DialogTitle>
      <Mui.DialogContent sx={{ pb: 3 }}>
        <Mui.Typography gutterBottom variant="h6" component="div">
          {`${pair.token0.displayName}/${pair.token1.displayName}`}
        </Mui.Typography>
        <Mui.TextField
          autoFocus
          id="remove-amount"
          label={intl.formatMessage({ defaultMessage: 'Amount' })}
          type="text"
          size="small"
          margin="normal"
          value={trade.amount}
          onChange={(e) => dispatch({
            type: 'amount_changed',
            value: /^\d*\.?\d*$/.test(e.target.value) ? e.target.value : trade.amount
          })}
          fullWidth
          helperText={balance && intl.formatMessage({ defaultMessage: 'Balance: {balance}' }, { balance: balance.toFixed() })}
          sx={{ mt: 1 }}
          InputProps={{
            endAdornment: <Mui.InputAdornment position="end">
              <Mui.Button sx={{ mr: '-12px' }} size="small" onClick={() => dispatch({ type: 'amount_changed', value: balance.toFixed() })} >
                {intl.formatMessage({ defaultMessage: 'Max' })}
              </Mui.Button>
            </Mui.InputAdornment>
          }}
          FormHelperTextProps={{
            sx: {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }
          }}
        />
        <Mui.Collapse in={showInfo}>
          <Mui.Typography noWrap gutterBottom variant="subtitle1" component="div">
            {intl.formatMessage({ defaultMessage: 'Reward (estimated)' })}
          </Mui.Typography>
          <InfoLine
            name={pair.token0.displayName}
            value={trade.amount0.toFixed()}
          />
          <InfoLine
            name={pair.token1.displayName}
            value={trade.amount1.toFixed()}
          />
        </Mui.Collapse>
        <Mui.Button fullWidth style={{textTransform: 'none'}} variant={display.buttonVariant} onClick={display.buttonOnClick} disabled={display.buttonDisabled}>
          {display.buttonText}
        </Mui.Button>
      </Mui.DialogContent>
    </>
  )
}