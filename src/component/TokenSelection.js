import { useIntl } from 'react-intl'
import { useTokenGraph } from './TokenGraph'
import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react'
import { useChain } from './Chain'
import { makeStyles } from '@material-ui/core/styles';
import * as Mui from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import HT from '../assets/ht.png'
import WHT from '../assets/wht.png'
import VIT from '../assets/vit.png'
import USDT from '../assets/usdt.png'
import DEFAULT from '../assets/default.png'
const initialState = {
  token0: {},
  token1: {},
  show: false
}




const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    '& > *': {
      margin: theme.spacing(1),
    },
  },
  small: {
    width: theme.spacing(3),
    height: theme.spacing(3),
  },
  large: {
    width: theme.spacing(3),
    height: theme.spacing(3),
  },
}));

function getImg(displayName){
  switch(displayName){
      case "HT":
      return HT;
      case "WHT":
      return WHT;
      case "VIT":
      return VIT; 
      case "USDT":
      return USDT; 
      default:
      return DEFAULT;
  }
}

const TokenSelectionContext = createContext()

export const useTokenSelection = () => useContext(TokenSelectionContext)

const TokenSelectionDispatchContext = createContext()

export const useTokenSelectionDispatch = () => useContext(TokenSelectionDispatchContext)

export function TokenSelectionProvider(props) {
  const isToken0 = useRef()
  const reducer = useCallback((state, action) => {
    const newState = { ...state }
    switch (action.type) {
      case 'set_token':
        isToken0.current = action.isToken0
        break
      case 'open':
        isToken0.current = action.isToken0
        newState.show = true
        break
      case 'select':
        if (isToken0.current) {
          if (action.token.address === state.token1.address) {
            newState.token1 = state.token0
            newState.token0 = state.token1
          } else {
            newState.token0 = action.token
          }
        } else {
          if (action.token.address === state.token0.address) {
            newState.token1 = state.token0
            newState.token0 = state.token1
          } else {
            newState.token1 = action.token
          }
        }
        newState.show = false
        break
      case 'exchange_position':
        newState.token1 = state.token0
        newState.token0 = state.token1
        break
      case 'close':
        if (newState.show) {
          newState.show = false
          break
        } else {
          return state
        }
      default:
        throw new Error();
    }
    return newState
  }, [])
  const [state, dispatch] = useReducer(reducer, initialState)

  return (
    <TokenSelectionContext.Provider value={state}>
      <TokenSelectionDispatchContext.Provider value={dispatch}>
        {props.children}
        <TokenSelection
          dispatch={dispatch}
          show={state.show}
          hideETH={props.hideETH}
        />
      </TokenSelectionDispatchContext.Provider>
    </TokenSelectionContext.Provider>
  )
}

function TokenSelection(props) {
  const classes = useStyles();
  const { show, dispatch, hideETH } = props
  const tokenGraph = useTokenGraph()
  const intl = useIntl()
  const chain = useChain()
  const requestId = useRef(0)
  const [listItems, setListItems] = useState()
  const [searchValue, setSearchValue] = useState('')
  const [requesting, setRequesting] = useState(false)

  useEffect(() => { show || setSearchValue('') }, [show])

  useEffect(() => {
    if (chain) {
      const results = []
      const checksumAddress = chain.web3.utils.isAddress(searchValue) && chain.web3.utils.toChecksumAddress(searchValue)
      const searchValueLowerCase = searchValue.toLowerCase()
      if (!hideETH && (!searchValue || chain.eth.displayName.toLowerCase().indexOf(searchValueLowerCase) !== -1)) {
        results.push(
          <Mui.ListItem key={chain.eth.address} button onClick={() => dispatch({ type: 'select', token: { ...chain.eth } })}>
            <Mui.ListItemAvatar>
              <Mui.Avatar src= {getImg(chain.eth.displayName)} className={classes.big} />
            </Mui.ListItemAvatar>
            <Mui.ListItemText
              primary={chain.eth.displayName}
              secondary={chain.eth.name}
              primaryTypographyProps={{ noWrap: true }}
              secondaryTypographyProps={{ noWrap: true }}
            />
          </Mui.ListItem>
        )
      }
      for (const address in tokenGraph.tokens) {
        const token = tokenGraph.tokens[address]
        if (!searchValue || token.displayName.toLowerCase().indexOf(searchValueLowerCase) !== -1
          || address === checksumAddress) {
          results.push(

            <Mui.ListItem key={address} button onClick={() => dispatch({ type: 'select', token: { ...token, address } })}>
              <Mui.ListItemAvatar>
               <Mui.Avatar src= {getImg(token.displayName)} className={classes.big} />
              </Mui.ListItemAvatar>
              <Mui.ListItemText
                primary={token.displayName}
                secondary={token.name}
                primaryTypographyProps={{ noWrap: true }}
                secondaryTypographyProps={{ noWrap: true }}
              />
            </Mui.ListItem>
          )
        }
      }
      if (checksumAddress && results.length === 0) {
        const address = checksumAddress
        const _requestId = requestId.current
        const erc20 = chain.contracts.erc20.clone()
        erc20.options.address = address
        Promise.all([
          erc20.methods.name().call(),
          erc20.methods.symbol().call(),
          erc20.methods.decimals().call()
        ]).then(([name, symbol, decimals]) => {
          if (_requestId === requestId.current) {
            const token = { name, symbol, decimals: parseInt(decimals) || 0, displayName: symbol || name || address, address }
            setListItems(
              <Mui.ListItem key={address} button onClick={() => dispatch({ type: 'select', token })}>
               <Mui.ListItemAvatar>
               <Mui.Avatar src= {getImg(token.displayName)} className={classes.big} />
              </Mui.ListItemAvatar>
                <Mui.ListItemText
                  primary={token.displayName}
                  secondary={token.name}
                  primaryTypographyProps={{ noWrap: true }}
                  secondaryTypographyProps={{ noWrap: true }}
                />
              </Mui.ListItem>
            )
            setRequesting(false)
          }
        }).catch((error) => {
          if (_requestId === requestId.current) {
            setListItems()
            setRequesting(false)
          }
        })
        setRequesting(true)
        return () => { requestId.current++ }
      } else {
        setListItems(results)
      }
    } else {
      setListItems()
    }
  }, [chain, tokenGraph.tokens, searchValue, dispatch, hideETH])

  return (
    <Mui.Dialog
      open={show}
      scroll="paper"
      onClose={() => dispatch({ type: 'close' })}
      maxWidth="xs"
      fullWidth
    >
      <Mui.DialogTitle disableTypography>
        <Mui.Typography variant="h6" component="div">
          {intl.formatMessage({ defaultMessage: 'Choose' })}
        </Mui.Typography>
        <Mui.IconButton
          onClick={() => dispatch({ type: 'close' })}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </Mui.IconButton>
        <Mui.TextField
          autoFocus
          id="search-token"
          margin="dense"
          label="Search"
          type="text"
          value={searchValue}
          placeholder={intl.formatMessage({ defaultMessage: 'Input name or address' })}
          onChange={(e) => setSearchValue(e.target.value)}
          variant="standard"
          fullWidth
        />
      </Mui.DialogTitle>
      <Mui.DialogContent dividers sx={{ px: 1, py: 0 }}>
        <Mui.List>
          {requesting ?
            <Mui.Box sx={{ px: 2, py: 1 }}>
              <Mui.Typography variant="body1"><Mui.Skeleton width={80} /></Mui.Typography>
              <Mui.Typography variant="body2"><Mui.Skeleton /></Mui.Typography>
            </Mui.Box>
            : listItems
          }
        </Mui.List>
      </Mui.DialogContent>
    </Mui.Dialog >
  )
}