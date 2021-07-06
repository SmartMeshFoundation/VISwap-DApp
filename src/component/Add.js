import { useCallback, useState, useReducer, useEffect, useRef, useMemo } from 'react';
import { Link } from './Router';
import TokenInput from './TokenInput'
import TransactionSettings, { useTransactionSettings } from './TransactionSettings'
import { useIntl } from 'react-intl';
import { useTokenSelection, useTokenSelectionDispatch } from './TokenSelection';
import { useWallet } from 'use-wallet';
import { useChain } from './Chain';
import { useTokenGraph } from './TokenGraph';
import InfoLine from './InfoLine';
import useContractChecker from './useContractChecker';
import * as Mui from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import SwapHorizIcon from '@material-ui/icons/SwapHoriz';
import { useMessage } from './Message';
import { BN1, BN0, BigNumber } from './utils'
import '../styles/custom.css'
import ADD from '../assets/add.png'
const initialTrade = {
  amount0: '',
  amount1: ''
}

export default function Add() {
  const theme = Mui.useTheme()
  const media = Mui.useMediaQuery(theme.breakpoints.up('lg'))
  const { token0, token1 } = useTokenSelection()
  const intl = useIntl()
  const wallet = useWallet()
  const chain = useChain()
  const tokenGraph = useTokenGraph()
  const requestId = useRef(0)
  const tokenSelectionDispatch = useTokenSelectionDispatch()
  const [priceViewInversed, setPriceViewInversed] = useState(false)
  const { getMinOutput, getDeadline } = useTransactionSettings()
  const { wrapWeb3Request } = useMessage()
  const [pair, setPair] = useState({}) // { address, inverse, decimals }
  const [lpToken, setLpToken] = useState(BN0)

  useEffect(() => {
    if (chain && token0.address && token1.address) {
      const address0 = token0.address === chain.eth.address ? chain.eth.weth : token0.address
      const address1 = token1.address === chain.eth.address ? chain.eth.weth : token1.address
      const pairAddress = address0 in tokenGraph.paths && tokenGraph.paths[address0][address1]
      /*if (address0 === address1) {
         setPair({
           address: null
         })
      } else*/
       if (pairAddress) {
        setPair({
          address: pairAddress,
          decimals: tokenGraph.pairs[pairAddress].decimals,
          inverse: address0.toLowerCase() > address1.toLowerCase()
        })
      } else {
        setPair(pair => typeof pair.address !== 'undefined' ? {} : pair)
      }
    } else {
      setPair(pair => typeof pair.address !== 'undefined' ? {} : pair)
    }
  }, [token0.address, token1.address, tokenGraph, chain])

  const balance0 = useContractChecker({
    type: 'balance',
    id: token0.address,
    decimals: token0.decimals
  })
  const allowance0 = useContractChecker({
    type: 'allowanceOfRouter',
    id: token0.address,
    decimals: token0.decimals
  })
  const balance1 = useContractChecker({
    type: 'balance',
    id: token1.address,
    decimals: token1.decimals
  })
  const allowance1 = useContractChecker({
    type: 'allowanceOfRouter',
    id: token1.address,
    decimals: token1.decimals
  })
  const totalSupply = useContractChecker({
    type: 'totalSupply',
    id: pair.address,
    decimals: pair.decimals
  })
  const _currentPrice = useContractChecker({
    type: 'currentPrice',
    id: pair.address,
    decimals0: pair.inverse ? token1.decimals : token0.decimals,
    decimals1: pair.inverse ? token0.decimals : token1.decimals
  })
  //合约里的价格是反的
  const currentPrice = useMemo(() =>
    pair.inverse ? _currentPrice : BN1.div(_currentPrice),
    [_currentPrice, pair.inverse]
  )

  const addLiquidity = useCallback((trade, send) => {
    let method;
    let options;
    if (token0.address === chain.eth.address) {
      method = chain.contracts.router.methods.addLiquidityETH(
        token1.address,
        new BigNumber(trade.amount1).shiftedBy(token1.decimals).toFixed(0),
        getMinOutput(trade.amount1).shiftedBy(token1.decimals).toFixed(0),
        getMinOutput(trade.amount0).shiftedBy(token0.decimals).toFixed(0),
        wallet.account,
        getDeadline()
      )
      options = {
        from: wallet.account,
        value: new BigNumber(trade.amount0).shiftedBy(18).toFixed(0)
      }
    } else if (token1.address === chain.eth.address) {
      method = chain.contracts.router.methods.addLiquidityETH(
        token0.address,
        new BigNumber(trade.amount0).shiftedBy(token0.decimals).toFixed(0),
        getMinOutput(trade.amount0).shiftedBy(token0.decimals).toFixed(0),
        getMinOutput(trade.amount1).shiftedBy(token1.decimals).toFixed(0),
        wallet.account,
        getDeadline()
      )
      options = {
        from: wallet.account,
        value: new BigNumber(trade.amount1).shiftedBy(18).toFixed(0)
      }
    } else {
      method = chain.contracts.router.methods.addLiquidity(
        token0.address,
        token1.address,
        new BigNumber(trade.amount0).shiftedBy(token0.decimals).toFixed(0),
        new BigNumber(trade.amount1).shiftedBy(token1.decimals).toFixed(0),
        getMinOutput(trade.amount0).shiftedBy(token0.decimals).toFixed(0),
        getMinOutput(trade.amount1).shiftedBy(token1.decimals).toFixed(0),
        wallet.account,
        getDeadline()
      )
      options = { from: wallet.account }
    }

    if (send) {
      wrapWeb3Request(method.send(options))
    } else {
      return method.call(options)
    }
  }, [chain, token0.address, token1.address, token0.decimals, token1.decimals,
    getMinOutput, getDeadline, wallet.account, wrapWeb3Request])

  const reducer = useCallback((state, action) => {
    const newState = { ...state }

    switch (action.type) {
      case 'amount_changed':
        if (action.address && token1.address === action.address) {
          newState.amount1 = action.value
          if (newState.amount1) {
            if (_currentPrice) {
              newState.amount0 = new BigNumber(newState.amount1).times(currentPrice).toMaxDecimals(token0.decimals)
            }
          } else {
            if (_currentPrice) {
              newState.amount0 = initialTrade.amount0
            }
          }
        } else {
          // 默认是token0改变
          if (typeof action.value !== 'undefined') {
            newState.amount0 = action.value
          }
          if (newState.amount0) {
            if (_currentPrice) {
              newState.amount1 = new BigNumber(newState.amount0).div(currentPrice).toMaxDecimals(token1.decimals)
            }
          } else {
            if (_currentPrice) {
              newState.amount1 = initialTrade.amount1
            }
          }
        }
        break
      default:
        throw new Error()
    }
    return newState
  }, [pair, token1.address, token0.decimals, token1.decimals, _currentPrice])
  const [trade, dispatch] = useReducer(reducer, initialTrade)

  useEffect(() => {
    dispatch({ type: 'amount_changed' })
  }, [balance0, balance1, allowance0, allowance1, _currentPrice])

  useEffect(() => {
    const _requestId = requestId.current
    if (trade.amount0 && trade.amount1 && pair.address !== null) {
      const id = setTimeout(() => {
        addLiquidity(trade).then(({ liquidity }) => {
          _requestId === requestId.current && setLpToken(new BigNumber(liquidity).shiftedBy(- 18))
        }).catch((error) => {
          _requestId === requestId.current && setLpToken(error.message.startsWith("execution reverted: Ownable: caller is not the owner") ? new BigNumber(-1) : BN0)
        })
      }, 500)
      return () => { clearTimeout(id); requestId.current++ }
    } else {
      return () => { requestId.current++ }
    }
  }, [trade, pair, addLiquidity])

  const inputDisable = !token0.address || !token1.address || pair.address === null

  let display;
  if (wallet.status !== 'connected' || !wallet.account) {
    display = {
      buttonText: intl.formatMessage({ defaultMessage: 'Connect Wallet' }),
      buttonVariant: "contained",
      buttonOnClick: () => wallet.connect()
    }
  } else if (!token0.address || !token1.address) {
    display = {
      buttonText: intl.formatMessage({ defaultMessage: 'Please Select Tokens' }),
      buttonVariant: "contained",
      buttonDisabled: true
    }
  } else if ((token0.address === chain.eth.address && token1.address === chain.eth.weth) || (token0.address === chain.eth.weth && token1.address === chain.eth.address)) {
    // 一个为ETH，一个为WETH
    display = {
      buttonText: intl.formatMessage({ defaultMessage: 'Invalid pair' }),
      buttonVariant: "contained",
      buttonDisabled: true
    }
  } else if (!parseFloat(trade.amount0) || !parseFloat(trade.amount1)) {
    display = {
      buttonText: intl.formatMessage({ defaultMessage: 'Pleace Enter Amount' }),
      buttonVariant: "contained",
      buttonDisabled: true
    }
  } else if (!balance0 || !balance1 || !allowance0 || !allowance1) {
    display = {
      buttonText: intl.formatMessage({ defaultMessage: 'Loading...' }),
      buttonVariant: "contained",
      buttonDisabled: true
    }
  } else if (lpToken.lt(0)) {
    display = {
      buttonText: intl.formatMessage({ defaultMessage: 'Only Owner Can Add' }),
      buttonVariant: "contained",
      buttonDisabled: true
    }
  } else if (balance0.lt(trade.amount0) || balance1.lt(trade.amount1)) {
    display = {
      buttonText: intl.formatMessage({ defaultMessage: 'Insufficient Balance' }),
      buttonVariant: "contained",
      buttonDisabled: true
    }
  } else if (allowance0.lt(trade.amount0)) {
    display = {
      buttonText: intl.formatMessage({ defaultMessage: 'Approve {token}' }, {
        token: token0.displayName
      }),
      buttonVariant: "outlined",
      buttonOnClick: () => chain.approveToRouter(wallet.account, token0.address)
    }
  } else if (allowance1.lt(trade.amount1)) {
    display = {
      buttonText: intl.formatMessage({ defaultMessage: 'Approve {token}' }, {
        token: token1.displayName
      }),
      buttonVariant: "outlined",
      buttonOnClick: () => chain.approveToRouter(wallet.account, token1.address)
    }
  } else {
    display = {
      buttonText: intl.formatMessage({ defaultMessage: 'Add Liquidity' }),
      buttonVariant: "contained",
      buttonOnClick: () => addLiquidity(trade, true)
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
          {intl.formatMessage({ defaultMessage: 'Add Liquidity' })}
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
        <TokenInput
          title={intl.formatMessage({ defaultMessage: 'Input' })}
          amount={trade.amount0}
          token={token0}
          balance={balance0}
          dispatch={dispatch}
          disabled={inputDisable}
          hideMax={inputDisable}
          isToken0
        />
        <Mui.Grid container justifyContent="center" alignItems="center">
          <Mui.Grid item>
            <Mui.IconButton size="small" onClick={() => tokenSelectionDispatch({ type: 'exchange_position' })}>
              <img src={ADD}/>
            </Mui.IconButton>
          </Mui.Grid>
        </Mui.Grid>
        <TokenInput
          title={intl.formatMessage({ defaultMessage: 'Input' })}
          amount={trade.amount1}
          token={token1}
          balance={balance1}
          dispatch={dispatch}
          disabled={inputDisable}
          hideMax={inputDisable}
        />
        <Mui.Button className="custom-btn" style={{textTransform: 'none'}} fullWidth variant={display.buttonVariant} onClick={display.buttonOnClick} disabled={display.buttonDisabled}>
          {display.buttonText}
        </Mui.Button>

        <Mui.Collapse in={trade.amount0 && trade.amount1}>
          <InfoLine/>
          <InfoLine/>
          <InfoLine
            name={intl.formatMessage({ defaultMessage: 'Price' })}
            value={priceViewInversed ? (_currentPrice ? 1 / currentPrice : trade.amount1 / trade.amount0).toPrecision(8)
              : (_currentPrice ? 1 * currentPrice : trade.amount0 / trade.amount1).toPrecision(8)}
            unit={<>
              {priceViewInversed ? `${token1.displayName}/${token0.displayName}`
                : `${token0.displayName}/${token1.displayName}`}
              <Mui.IconButton size="small" onClick={() => setPriceViewInversed(!priceViewInversed)}>
                <SwapHorizIcon fontSize="small" />
              </Mui.IconButton>
            </>}
          />
          <InfoLine
            name={intl.formatMessage({ defaultMessage: 'Reward (estimated)' })}
            tooltip={intl.formatMessage({ defaultMessage: 'The pool tokens you can receive.' })}
            value={lpToken.toFixed()}
            unit="LP Token"
          />
          <InfoLine
            name={intl.formatMessage({ defaultMessage: 'Share of Pool' })}
            tooltip={intl.formatMessage({ defaultMessage: 'The percentage of reward in the pool.' })}
            value={totalSupply ? (100 / (totalSupply / lpToken + 1)).toPrecision(3) : 100}
            unit="%"
          />
        </Mui.Collapse>
      </Mui.DialogContent>
    </>
  )
}