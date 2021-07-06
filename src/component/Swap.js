import { useTokenSelection, useTokenSelectionDispatch } from './TokenSelection'
import TransactionSettings, { useTransactionSettings } from './TransactionSettings'
import TokenInput from './TokenInput'
import { useWallet } from 'use-wallet'
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useIntl } from 'react-intl';
import { useChain } from './Chain';
import { useTokenGraph } from './TokenGraph';
import InfoLine from './InfoLine';
import * as Mui from '@material-ui/core';
import SwapHorizIcon from '@material-ui/icons/SwapHoriz';
import { useMessage } from './Message';
import useContractChecker from './useContractChecker';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import { BN1, BN0, BN2POW96, BNInfinity, BigNumber } from './utils'
import '../styles/custom.css'
import ArrowDownward from '../assets/arrow.svg'
const initialTrade = {
  amount0: '',
  amount1: '',
  price: '',
  priceViewInversed: false,
  bestRoute: undefined,
  priceWithImpact: BN0, // token1 per token0
  priceWithoutImpact: BNInfinity // token1 per token0
}

function Swap() {
  const theme = Mui.useTheme()
  const media = Mui.useMediaQuery(theme.breakpoints.up('lg'))
  const { token0, token1 } = useTokenSelection()
  const tokenSelectionDispatch = useTokenSelectionDispatch()
  const chain = useChain()
  const tokenGraph = useTokenGraph()
  const intl = useIntl()
  const wallet = useWallet()
  const requestId = useRef(0)
  const { getMinOutput, getDeadline, getMaxHops } = useTransactionSettings()
  const { wrapWeb3Request } = useMessage()
  const [pair, setPair] = useState({}) // { address, inverse, decimals, routes }
  const [type, setType] = useState('swap')

  const isDeposit = useMemo(() =>
    chain && token0.address === chain.eth.address && token1.address === chain.eth.weth,
    [token0.address, token1.address, chain]
  )

  const isWithdraw = useMemo(() =>
    chain && token1.address === chain.eth.address && token0.address === chain.eth.weth,
    [token0.address, token1.address, chain]
  )

  useEffect(() => {
    const newPair = {}
    if (chain && token0.address && token1.address) {
      const address0 = token0.address === chain.eth.address ? chain.eth.weth : token0.address
      const address1 = token1.address === chain.eth.address ? chain.eth.weth : token1.address
      const pairAddress = address0 in tokenGraph.paths && tokenGraph.paths[address0][address1]
      if (pairAddress && address0 !== address1) {
        newPair.address = pairAddress
        newPair.decimals = tokenGraph.pairs[pairAddress].decimals
        newPair.inverse = address0.toLowerCase() > address1.toLowerCase()
      }
      const routes = tokenGraph.findAllRoutes(address0, address1, getMaxHops())
      if (routes.length) {
        newPair.routes = routes
      }
    }

    setPair(pair => pair.routes || newPair.routes ? newPair : pair)
  }, [token0.address, token1.address, tokenGraph, chain, getMaxHops])

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
  const requestForAmount0Change = useCallback(async (_requestId, amount0) => {
    if (_requestId !== requestId.current || !pair.routes) {
      return
    }
    const output = await Promise.all(pair.routes.map((route) => {
      return chain.contracts.router.methods.getAmountOut(
        new BigNumber(amount0).shiftedBy(token0.decimals).toFixed(0),
        route
      ).call().catch((error) => ({ error }))
    }))
    let maxOutput = -1
    let index = -1
    const errors = []
    for (let i = 0; i < output.length; i++) {
      if (output[i].error) {
        errors.push(output[i].error)
        continue
      }
      const amountOut = new BigNumber(output[i].amountOut)
      if (amountOut.gt(maxOutput)) {
        index = i
        maxOutput = amountOut
      }
    }
    if (index !== -1) {
      dispatch({
        type: 'amount_changed_callback',
        bestRoute: pair.routes[index],
        amount1: new BigNumber(output[index].amountOut).shiftedBy(- token1.decimals),
        priceWithImpact: new BigNumber(output[index].priceX96WithImpact).div(BN2POW96).shiftedBy(token0.decimals - token1.decimals),
        priceWithoutImpact: new BigNumber(output[index].priceX96WithoutImpact).div(BN2POW96).shiftedBy(token0.decimals - token1.decimals),
        requestId: _requestId
      })
    } else {
      dispatch({
        type: 'amount_changed_callback',
        errors,
        amount1: BN0,
        priceWithImpact: BN0,
        priceWithoutImpact: BNInfinity,
        requestId: _requestId
      })
    }
  }, [chain, pair.routes, token0.decimals, token1.decimals])

  const reducer = useCallback((state, action) => {
    const newState = { ...state }

    switch (action.type) {
      case 'amount_changed':
        ++requestId.current
        if (action.address && token1.address === action.address) {
          newState.amount1 = action.value
          if (parseFloat(newState.price)) {
            newState.amount0 = newState.amount1 ? (
              newState.priceViewInversed ? new BigNumber(newState.amount1).div(newState.price) :
                new BigNumber(newState.amount1).times(newState.price)
            ).toMaxDecimals(token0.decimals) : ''
          } else {
            newState.price = ''
          }
        } else {
          // 默认是token0改变
          if (typeof action.value !== 'undefined') {
            newState.amount0 = action.value
          }
          if (type === 'swap' && !isDeposit && !isWithdraw) {
            if (parseFloat(newState.amount0)) {
              setTimeout(requestForAmount0Change, 500, requestId.current, newState.amount0)
            } else {
              newState.amount1 = ''
              newState.price = ''
            }
          } else {
            if (parseFloat(newState.price)) {
              newState.amount1 = newState.amount0 ? (
                newState.priceViewInversed ? new BigNumber(newState.amount0).times(newState.price)
                  : new BigNumber(newState.amount0).div(newState.price)
              ).toMaxDecimals(token1.decimals) : ''
            } else {
              newState.price = ''
            }
            newState.bestRoute = undefined
          }
        }
        break
      case 'price_changed':
        newState.price = action.value
        if (parseFloat(newState.price)) {
          if (newState.amount0) {
            newState.amount1 = (newState.priceViewInversed ? new BigNumber(newState.amount0).times(newState.price)
              : new BigNumber(newState.amount0).div(newState.price)).toMaxDecimals(token1.decimals)
          } else if (newState.amount1) {
            newState.amount0 = (newState.priceViewInversed ? new BigNumber(newState.amount1).div(newState.price)
              : new BigNumber(newState.amount1).times(newState.price)).toMaxDecimals(token0.decimals)
          }
        } else {
          if (newState.amount0) {
            newState.amount1 = ''
          }
        }
        break
      case 'price_view_inversed':
        newState.priceViewInversed = !state.priceViewInversed
        if (parseFloat(newState.price)) {
          newState.price = BN1.div(newState.price).toFixed()
        }
        break
      case 'amount_changed_callback':
        if (action.requestId !== requestId.current) {
          return state
        }
        newState.bestRoute = action.bestRoute
        newState.amount1 = action.amount1.toFixed()
        newState.priceWithImpact = action.priceWithImpact
        newState.priceWithoutImpact = action.priceWithoutImpact
        newState.price = (newState.priceViewInversed ? new BigNumber(newState.amount1).div(newState.amount0)
          : new BigNumber(newState.amount0).div(newState.amount1)).toFixed()

        break
      default:
        throw new Error()
    }
    return newState
  }, [type, isDeposit, isWithdraw, token1.address, token0.decimals, token1.decimals, requestForAmount0Change])
  const [trade, dispatch] = useReducer(reducer, initialTrade)


  useEffect(() => {
    return () => { requestId.current++ }
  }, [])

  useEffect(() => {
    dispatch({ type: 'amount_changed' })
  }, [balance0, allowance0, pair, type])

  useEffect(() => {
    if (isDeposit || isWithdraw) {
      type !== 'swap' && setType('swap')
      trade.price !== '1' && dispatch({ type: 'price_changed', value: '1' })
    }
  }, [isDeposit, isWithdraw, type, trade.price])

  const swap = useCallback((trade, send) => {
    let method;
    let options;
    if (type === 'limit') {
      const fromContractPrice = (price) => {
        //合约里的价格是反的
        if (!(pair.inverse ^ trade.priceViewInversed)) {
          price = BN1.div(price)
        }
        if (trade.priceViewInversed) {
          price = new BigNumber(price).shiftedBy(token0.decimals - token1.decimals)
        } else {
          price = new BigNumber(price).shiftedBy(token1.decimals - token0.decimals)
        }
        return price
      }

      const toContractPrice = (price) => {
        if (trade.priceViewInversed) {
          price = new BigNumber(price).shiftedBy(token1.decimals - token0.decimals)
        } else {
          price = new BigNumber(price).shiftedBy(token0.decimals - token1.decimals)
        }
        if (!(pair.inverse ^ trade.priceViewInversed)) {
          price = BN1.div(price)
        }

        return price
      }

      let tick = Math.log(toContractPrice(trade.price)) / Math.log(1.0001)
      tick = pair.inverse ? Math.floor(tick) : Math.ceil(tick)
      const price = fromContractPrice(1.0001 ** tick).toFixed()
      if (token0.address === chain.eth.address) {
        method = chain.contracts.router.methods.putLimitOrderETH(pair.address, tick)
        options = {
          from: wallet.account,
          value: new BigNumber(trade.amount0).shiftedBy(18).toFixed(0)
        }
      } else {
        method = chain.contracts.router.methods.putLimitOrder(
          pair.address,
          token0.address,
          new BigNumber(trade.amount0).shiftedBy(token0.decimals).toFixed(0),
          tick
        )
        options = { from: wallet.account }
      }
      dispatch({ type: 'price_changed', value: price })
    } else {
      if (token0.address === chain.eth.address) {
        method = chain.contracts.router.methods.swapExactETHForTokens(
          getMinOutput(trade.amount1).shiftedBy(token1.decimals).toFixed(0),
          trade.bestRoute, wallet.account,
          getDeadline()
        )
        options = {
          from: wallet.account,
          value: new BigNumber(trade.amount0).shiftedBy(18).toFixed(0)
        }
      } else if (token1.address === chain.eth.address) {
        method = chain.contracts.router.methods.swapExactTokensForETH(
          new BigNumber(trade.amount0).shiftedBy(token0.decimals).toFixed(0),
          getMinOutput(trade.amount1).shiftedBy(token1.decimals).toFixed(0),
          trade.bestRoute,
          wallet.account,
          getDeadline()
        )
        options = { from: wallet.account }
      } else {
        method = chain.contracts.router.methods.swapExactTokensForTokens(
          new BigNumber(trade.amount0).shiftedBy(token0.decimals).toFixed(0),
          getMinOutput(trade.amount1).shiftedBy(token1.decimals).toFixed(0),
          trade.bestRoute,
          wallet.account,
          getDeadline()
        )
        options = { from: wallet.account }
      }
    }

    if (send) {
      wrapWeb3Request(method.send(options))
    } else {
      return method.call(options)
    }
  }, [chain, pair, type, token0.address, token1.address, token0.decimals, token1.decimals,
    wallet.account, getMinOutput, getDeadline, wrapWeb3Request])

  let display;
  if (wallet.status !== 'connected' || !wallet.account) {
    display = {
      buttonText: intl.formatMessage({ defaultMessage: 'Connect Wallet' }),
      buttonVariant: "contained",
      buttonOnClick: () => console.log("metamask state update:")
    }
  } else if (!token0.address || !token1.address) {
    display = {
      buttonText: intl.formatMessage({ defaultMessage: 'Please Select Tokens' }),
      buttonVariant: "contained",
      buttonDisabled: true
    }
  } else if (!pair.routes || (type === 'limit' && !pair.address)) {
    display = {
      buttonText: intl.formatMessage({ defaultMessage: 'No Trade Route' }),
      buttonVariant: "contained",
      buttonDisabled: true
    }
  } else if (!trade.amount0 || !trade.amount1 || !trade.price) {
    display = {
      buttonText: intl.formatMessage({ defaultMessage: 'Pleace Enter Amount' }),
      buttonVariant: "contained",
      buttonDisabled: true,
    }
  } else if (!balance0 || !allowance0) {
    display = {
      buttonText: intl.formatMessage({ defaultMessage: 'Loading...' }),
      buttonVariant: "contained",
      buttonDisabled: true,
    }
  } else if (balance0.lt(trade.amount0)) {
    display = {
      buttonText: intl.formatMessage({ defaultMessage: 'Insufficient Balance' }),
      buttonVariant: "contained",
      buttonDisabled: true,
    }
  } else if (allowance0.lt(trade.amount0)) {
    display = {
      buttonText: intl.formatMessage({ defaultMessage: 'Approve {token}' }, {
        token: token0.displayName
      }),
      buttonVariant: "outlined",
      buttonOnClick: () => chain.approveToRouter(wallet.account, token0.address),
    }
  } else if (isDeposit) {
    display = {
      buttonText: intl.formatMessage({ defaultMessage: 'Deposit' }),
      buttonVariant: "contained",
      buttonOnClick: () => chain.depositWeth(wallet.account, trade.amount0),
    }
  } else if (isWithdraw) {
    display = {
      buttonText: intl.formatMessage({ defaultMessage: 'Withdraw' }),
      buttonVariant: "contained",
      buttonOnClick: () => chain.withdrawWeth(wallet.account, trade.amount0)
    }
  } else {
    display = {
      buttonText: intl.formatMessage({ defaultMessage: 'Swap' }),
      buttonVariant: "contained",
      buttonOnClick: () => swap(trade, true),
    }
  }

  const routeDisplay = useMemo(() => {
    if (!trade.bestRoute) {
      return ''
    } else {
      let result = `${token0.displayName}`
      for (let i = 1; i < trade.bestRoute.length - 1; i++) {
        result += `->${tokenGraph.tokens[trade.bestRoute[i]].displayName}`
      }
      result += `->${token1.displayName}`
      return result
    }
  }, [trade.bestRoute, tokenGraph, token0.displayName, token1.displayName])

  return (
    <>
   
      <Mui.Paper spacing={0} sx={{ marginTop: {xs: "20px", sm: "15px"}, overflow: "hidden",boxShadow: "none"  }} >
        <Mui.DialogTitle disableTypography sx={{ position: 'relative' }}>
          <Mui.Typography gutterBottom variant="h6" component="div">
            {intl.formatMessage({ defaultMessage: 'Swap' })}
          </Mui.Typography>
          <Mui.Box
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <TransactionSettings showMaxHops />
          </Mui.Box>
        </Mui.DialogTitle>
        <Mui.DialogContent sx={{ pb: 3 }}>
          <TokenInput
            title={intl.formatMessage({ defaultMessage: 'From' })}
            amount={trade.amount0}
            token={token0}
            balance={balance0}
            dispatch={dispatch}
            disabled={!pair.routes || (type === 'limit' && !pair.address)}
            isToken0
          />
          <Mui.Grid container justifyContent="center" alignItems="center">
            <Mui.Grid item>
              <Mui.IconButton size="small" onClick={() => tokenSelectionDispatch({ type: 'exchange_position' })}>
              <img src={ArrowDownward}/>
            </Mui.IconButton>
            </Mui.Grid>
          </Mui.Grid>
          <TokenInput
            title={intl.formatMessage({ defaultMessage: 'To' })}
            amount={trade.amount1}
            token={token1}
            balance={balance1}
            dispatch={dispatch}
            disabled={type === 'swap' || !pair.address}
            hideMax
          />
          <Mui.TextField
            label={intl.formatMessage({ defaultMessage: 'Price' })}
            type="text"
            size="small"
            margin="normal"
            value={trade.price}
            onChange={(e) => dispatch({
              type: 'price_changed',
              value: /^\d*\.?\d*$/.test(e.target.value) ? e.target.value : trade.price
            })}
            helperText={type === 'limit' && currentPrice && intl.formatMessage({
              defaultMessage: 'Current: {current}'
            }, {
              current: currentPrice
            })}
            fullWidth
            disabled={type === 'swap' || !pair.address}
            sx={{ mt: 1 }}
            InputProps={{
              endAdornment: ((type === 'swap' && pair.routes) || pair.address) && <Mui.InputAdornment position="end">
                <Mui.Button sx={{ mr: '-12px' }} size="small" onClick={() => dispatch({ type: 'price_view_inversed' })} >
                  {trade.priceViewInversed ? `${token1.displayName}/${token0.displayName}`
                    : `${token0.displayName}/${token1.displayName}`}
                  <SwapHorizIcon />
                </Mui.Button>
              </Mui.InputAdornment>
            }}
            InputLabelProps={{
              shrink: true
            }}
            FormHelperTextProps={{
              sx: {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }
            }}
          />
          <Mui.Button className="custom-bg"  style={{textTransform: 'none'}} fullWidth variant={display.buttonVariant} onClick={display.buttonOnClick} disabled={display.buttonDisabled}>
            {display.buttonText}
          </Mui.Button>

          <Mui.Collapse in={type === 'swap' && !isDeposit && !isWithdraw && trade.amount1}>
            <InfoLine/>
            <InfoLine/>
            <InfoLine
              name={intl.formatMessage({ defaultMessage: 'Minimum received' })}
              tooltip={intl.formatMessage({ defaultMessage: 'Your transaction will revert if there is a large, unfavorable price movement before it is confirmed.' })}
              value={getMinOutput(trade.amount1).toMaxDecimals(token1.decimals)}
              unit={token1.displayName}
            />
            <InfoLine
              name={intl.formatMessage({ defaultMessage: 'Price Impact' })}
              tooltip={intl.formatMessage({ defaultMessage: 'The difference between the market price and estimated price due to trade size.' })}
              value={BN1.minus(trade.priceWithImpact.div(trade.priceWithoutImpact)).shiftedBy(2).toPrecision(3)}
              unit="%"
            />
            <InfoLine
              name={intl.formatMessage({ defaultMessage: 'Trade Route' })}
              tooltip={intl.formatMessage({ defaultMessage: 'The tokens swap order that your transaction will follow.' })}
              unit={routeDisplay}
            />
          </Mui.Collapse>

        </Mui.DialogContent>
      </Mui.Paper>
    </>
  )
}

export default function SwapPage() {

  return (
    <Mui.Container>
      <Mui.Grid container spacing={3} p={3}  >
        <Mui.Grid item lg={6} width="100%" >
          <Swap />
        </Mui.Grid>
      </Mui.Grid>
    </Mui.Container>
  )
}