import { useEffect, useMemo } from 'react';
import { Switch, Route, useParams, useRouteMatch } from "react-router-dom";
import { Link, Redirect } from './Router'
import { useIntl } from 'react-intl';
import { useTokenGraph } from './TokenGraph';
import Add from './Add'
import Remove from './Remove'
import * as Mui from '@material-ui/core';
import useContractChecker from './useContractChecker';
import { useTokenSelectionDispatch } from './TokenSelection';
import '../styles/custom.css'
function LiquidityItem({ address }) {
  const tokenGraph = useTokenGraph()
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
  return balance > 0 && (
    <Mui.ListItem component={Link} key={address} button to={`/liquidity/${address}`}>
      <Mui.ListItemText
        primary={`${pair.token0.displayName}/${pair.token1.displayName}`}
        secondary={balance.toFixed()}
        primaryTypographyProps={{ noWrap: true }}
        secondaryTypographyProps={{ noWrap: true }}
      />
    </Mui.ListItem>
  )
}

function MyLiquidity() {
  const tokenGraph = useTokenGraph()
  const intl = useIntl()

  return (
    <>
      <Mui.DialogTitle disableTypography>
        <Mui.Grid container justifyContent="space-between" alignItems="center" >
          <Mui.Grid item>
            <Mui.Typography gutterBottom variant="h6" component="div">
              {intl.formatMessage({ defaultMessage: 'My Liquidity' })}
            </Mui.Typography>
          </Mui.Grid>
          <Mui.Grid item>
            <Mui.Button style={{textTransform: 'none'}} className='cn-custom-btn' component={Link} variant="outlined" size="small" to="/liquidity/add">
              {intl.formatMessage({ defaultMessage: 'Add Liquidity' })}
            </Mui.Button>
          </Mui.Grid>
        </Mui.Grid>
      </Mui.DialogTitle>
      <Mui.DialogContent sx={{ p: 0 }}>
        <Mui.List sx={{ px: 1 }}>
          {Object.keys(tokenGraph.pairs).map((address) => <LiquidityItem key={address} address={address} />)}
        </Mui.List>
      </Mui.DialogContent>
    </>
  )
}

function InnerRemove() {
  const tokenGraph = useTokenGraph()
  const { address } = useParams();

  return tokenGraph.pairsLength ?
    (address in tokenGraph.pairs ? <Remove address={address} /> : <Redirect to="/liquidity" />)
    : <Mui.Grid container p={3} justifyContent="center" alignItems="center">
      <Mui.Grid item>
        <Mui.CircularProgress />
      </Mui.Grid>
    </Mui.Grid>
}

function RedirectToAdd() {
  const tokenGraph = useTokenGraph()
  const tokenSelectionDispatch = useTokenSelectionDispatch()
  const { address } = useParams();

  useEffect(() => {
    if (address in tokenGraph.pairs) {
      const address0 = tokenGraph.pairs[address].token0
      const address1 = tokenGraph.pairs[address].token1
      tokenSelectionDispatch({ type: 'set_token', isToken0: true })
      tokenSelectionDispatch({ type: 'select', token: { ...tokenGraph.tokens[address0], address: address0 } })
      tokenSelectionDispatch({ type: 'set_token', isToken0: false })
      tokenSelectionDispatch({ type: 'select', token: { ...tokenGraph.tokens[address1], address: address1 } })
    }
  }, [address, tokenGraph, tokenSelectionDispatch])

  return tokenGraph.pairsLength ? <Redirect to="/liquidity/add" /> : undefined
}

export default function Liquidity() {
  const { path, isExact } = useRouteMatch();

  return (
    <Mui.Container >
      <Mui.Grid container spacing={3} p={3} >
        <Mui.Grid item width="100%" lg={6} display={{ xs: isExact ? 'block' : 'none', lg: 'block' }}>
          <Mui.Paper spacing={0} sx={{ marginTop: {xs: "20px", sm: "15px" },overflow: "hidden" ,boxShadow: "none" }} >
            <MyLiquidity />
          </Mui.Paper>
        </Mui.Grid>
        <Switch>
          <Route path={`${path}/add/:address`}>
            <RedirectToAdd />
          </Route>
          <Route path={`${path}/add`}>
            <Mui.Grid item width="100%" lg={6}>
              <Mui.Paper spacing={0} sx={{ marginTop: {xs: "20px", sm: "15px"}, overflow: "hidden" ,boxShadow: "none" }} >
                <Add />
              </Mui.Paper>
            </Mui.Grid>
          </Route>
          <Route path={`${path}/:address`}>
            <Mui.Grid item width="100%" lg={6}>
              <Mui.Paper spacing={0} sx={{ marginTop: {xs: "20px", sm: "15px"}, overflow: "hidden" ,boxShadow: "none" }} >
                <InnerRemove />
              </Mui.Paper>
            </Mui.Grid>
          </Route>
        </Switch>
      </Mui.Grid>
    </Mui.Container>
  )
}