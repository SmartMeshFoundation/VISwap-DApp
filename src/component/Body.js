import Swap from './Swap'
import Liquidity from './Liquidity'
import Home from './Home'
import Mine, { MinePoolsProvider } from './Mine'

import { useWallet } from 'use-wallet'
import { TokenSelectionProvider } from './TokenSelection'
import { Redirect, NavLink } from './Router'
import { Switch, Route } from "react-router-dom";
import { useIntl } from 'react-intl'
import * as Mui from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import AccountBalanceWalletIcon from '@material-ui/icons/AccountBalanceWallet';
import SwapHorizIcon from '@material-ui/icons/SwapHoriz';
import HomeIcon from '@material-ui/icons/Home';
import OpacityIcon from '@material-ui/icons/Opacity';
import FilterHdrIcon from '@material-ui/icons/FilterHdr';
import DnsIcon from '@material-ui/icons/Dns';
import { useState } from 'react'
import { chainOptions } from './Chain'
import logo from '../assets/logo.svg'

import home from '../assets/home.svg'
import swap from '../assets/swap.svg'
import farm from '../assets/farm.svg'
import pool from '../assets/pool.svg'
import homeSelected from '../assets/Home-Selected.svg'
import swapSelected from '../assets/Swap-Selected.svg'
import farmSelected from '../assets/Fram-Selected.svg'
import poolSelected from '../assets/Pool-Selected.svg'


import bridge from '../assets/bridge.svg'
import governance from '../assets/governance.svg'
import explorer from '../assets/explorer.svg'
import doc from '../assets/doc.svg'
import listing from '../assets/listing.svg'

import bridgeSelected from '../assets/Bridge-Selected.svg'
import governanceSelected from '../assets/Governance-Selected.svg'
import explorerSelected from '../assets/Explorer-Selected.svg'
import docSelected from '../assets/Doc-Selected.svg'
import listingSelected from '../assets/Listing-Selected.svg'

import menuToggleIcon from '../assets/menu-toggle-icon.png'


import '../styles/custom.css'

export default function Body() {
  const wallet = useWallet()
  const intl = useIntl()
  const [mobileOpen, setMobileOpen] = useState(false);

  const drawer = (
    <Mui.Box sx={{ overflow: 'auto' }}>
      <Mui.List>
        <Mui.ListItem
          button
          onClick={() => setMobileOpen(false)}
          component={NavLink}
          to="/"
          activeClassName="Mui-selected selected_active"
          exact
        >
          <Mui.ListItemIcon>
            <img className="menu-icon" src={home}></img>
            <img className="menu-selected-icon" src={homeSelected}></img>
          </Mui.ListItemIcon>
          <Mui.ListItemText className="menu-text" primary={intl.formatMessage({ defaultMessage: 'Home' })} />
        </Mui.ListItem>
      </Mui.List>
      {/* <Mui.Divider /> */}
        <Mui.ListItem
          button
          onClick={() => setMobileOpen(false)}
          component={NavLink}
          to="/swap"
          activeClassName="Mui-selected selected_active"
        >
          <Mui.ListItemIcon>
            <img className="menu-icon" src={swap}></img>
            <img className="menu-selected-icon" src={swapSelected}></img>
          </Mui.ListItemIcon>
          <Mui.ListItemText className="menu-text" primary={intl.formatMessage({ defaultMessage: 'Swap' })} />
        </Mui.ListItem>
        <Mui.ListItem
          button
          onClick={() => setMobileOpen(false)}
          component={NavLink}
          to="/liquidity"
          activeClassName="Mui-selected selected_active"
        >
          <Mui.ListItemIcon>
            <img className="menu-icon" src={pool}></img>
            <img className="menu-selected-icon" src={poolSelected}></img>
          </Mui.ListItemIcon>
          <Mui.ListItemText className="menu-text" primary={intl.formatMessage({ defaultMessage: 'Pool' })} />
        </Mui.ListItem>
        <Mui.List>
        <Mui.ListItem
          button
          onClick={() => setMobileOpen(false)}
          component={NavLink}
          to="/mine"
          activeClassName="Mui-selected selected_active"
        >
          <Mui.ListItemIcon>
            <img className="menu-icon" src={farm}></img>
            <img className="menu-selected-icon" src={farmSelected}></img>
          </Mui.ListItemIcon>
          <Mui.ListItemText className="menu-text" primary={intl.formatMessage({ defaultMessage: 'Farm' })} />
        </Mui.ListItem>

        <Mui.ListItem
          button
          onClick={() => setMobileOpen(false)}>
          <Mui.ListItemIcon>
            <img className="menu-icon" src={bridge}></img>
            <img className="menu-selected-icon" src={bridgeSelected}></img>
          </Mui.ListItemIcon>
          <Mui.ListItemText className="menu-text" primary={intl.formatMessage({ defaultMessage: 'Bridge' })} />
       
         </Mui.ListItem>

          <Mui.ListItem 
            button
          onClick={() => setMobileOpen(false)}>
          <Mui.ListItemIcon>
            <img className="menu-icon" src={governance}></img>
            <img className="menu-selected-icon" src={governanceSelected}></img>
          </Mui.ListItemIcon>
          <Mui.ListItemText className="menu-text" primary={intl.formatMessage({ defaultMessage: 'Governance' })} />
        </Mui.ListItem>

          <Mui.ListItem
            button
          onClick={() => setMobileOpen(false)}>
          <Mui.ListItemIcon>
            <img className="menu-icon" src={explorer}></img>
            <img className="menu-selected-icon" src={explorerSelected}></img>
          </Mui.ListItemIcon>
          <Mui.ListItemText className="menu-text" primary={intl.formatMessage({ defaultMessage: 'Explorer' })} />
        </Mui.ListItem>

          <Mui.ListItem 
           button
          onClick={() => setMobileOpen(false)}
     
          >
          <Mui.ListItemIcon>
            <img className="menu-icon" src={doc}></img>
            <img className="menu-selected-icon" src={docSelected}></img>
          </Mui.ListItemIcon>
          <Mui.ListItemText className="menu-text" primary={intl.formatMessage({ defaultMessage: 'Doc' })} />
        </Mui.ListItem>
        
         <Mui.ListItem
           button
          onClick={() => setMobileOpen(false)}>
          <Mui.ListItemIcon>
            <img className="menu-icon" src={listing}></img>
            <img className="menu-selected-icon" src={listingSelected}></img>
          </Mui.ListItemIcon>
          <Mui.ListItemText className="menu-text" primary={intl.formatMessage({ defaultMessage: 'Listing' })} />
        </Mui.ListItem>
      </Mui.List>

      <div className="SmartMesh">
        <div className="title">Powered by SmartMesh</div>
        <div className="text">© 2021 VISwap. All rights reserved.</div>
      </div>
    </Mui.Box>
  )

  return (
    <Mui.Box className="page_con">
      <Mui.AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, background:"white"}} className="app_bar">
        <Mui.Toolbar className="w" sx={{background:"white", paddingLeft: 3}}>
          
          <img className="logo-img" src={logo}></img>
          {/* <Mui.SvgIcon sx={{ ml: '-12px', fontSize: '4rem', display: { xs: 'none', sm: 'block' } }} viewBox="0 0 841.9 595.3">
            <path d="M666.3 296.5c0-32.5-40.7-63.3-103.1-82.4 14.4-63.6 8-114.2-20.2-130.4-6.5-3.8-14.1-5.6-22.4-5.6v22.3c4.6 0 8.3.9 11.4 2.6 13.6 7.8 19.5 37.5 14.9 75.7-1.1 9.4-2.9 19.3-5.1 29.4-19.6-4.8-41-8.5-63.5-10.9-13.5-18.5-27.5-35.3-41.6-50 32.6-30.3 63.2-46.9 84-46.9V78c-27.5 0-63.5 19.6-99.9 53.6-36.4-33.8-72.4-53.2-99.9-53.2v22.3c20.7 0 51.4 16.5 84 46.6-14 14.7-28 31.4-41.3 49.9-22.6 2.4-44 6.1-63.6 11-2.3-10-4-19.7-5.2-29-4.7-38.2 1.1-67.9 14.6-75.8 3-1.8 6.9-2.6 11.5-2.6V78.5c-8.4 0-16 1.8-22.6 5.6-28.1 16.2-34.4 66.7-19.9 130.1-62.2 19.2-102.7 49.9-102.7 82.3 0 32.5 40.7 63.3 103.1 82.4-14.4 63.6-8 114.2 20.2 130.4 6.5 3.8 14.1 5.6 22.5 5.6 27.5 0 63.5-19.6 99.9-53.6 36.4 33.8 72.4 53.2 99.9 53.2 8.4 0 16-1.8 22.6-5.6 28.1-16.2 34.4-66.7 19.9-130.1 62-19.1 102.5-49.9 102.5-82.3zm-130.2-66.7c-3.7 12.9-8.3 26.2-13.5 39.5-4.1-8-8.4-16-13.1-24-4.6-8-9.5-15.8-14.4-23.4 14.2 2.1 27.9 4.7 41 7.9zm-45.8 106.5c-7.8 13.5-15.8 26.3-24.1 38.2-14.9 1.3-30 2-45.2 2-15.1 0-30.2-.7-45-1.9-8.3-11.9-16.4-24.6-24.2-38-7.6-13.1-14.5-26.4-20.8-39.8 6.2-13.4 13.2-26.8 20.7-39.9 7.8-13.5 15.8-26.3 24.1-38.2 14.9-1.3 30-2 45.2-2 15.1 0 30.2.7 45 1.9 8.3 11.9 16.4 24.6 24.2 38 7.6 13.1 14.5 26.4 20.8 39.8-6.3 13.4-13.2 26.8-20.7 39.9zm32.3-13c5.4 13.4 10 26.8 13.8 39.8-13.1 3.2-26.9 5.9-41.2 8 4.9-7.7 9.8-15.6 14.4-23.7 4.6-8 8.9-16.1 13-24.1zM421.2 430c-9.3-9.6-18.6-20.3-27.8-32 9 .4 18.2.7 27.5.7 9.4 0 18.7-.2 27.8-.7-9 11.7-18.3 22.4-27.5 32zm-74.4-58.9c-14.2-2.1-27.9-4.7-41-7.9 3.7-12.9 8.3-26.2 13.5-39.5 4.1 8 8.4 16 13.1 24 4.7 8 9.5 15.8 14.4 23.4zM420.7 163c9.3 9.6 18.6 20.3 27.8 32-9-.4-18.2-.7-27.5-.7-9.4 0-18.7.2-27.8.7 9-11.7 18.3-22.4 27.5-32zm-74 58.9c-4.9 7.7-9.8 15.6-14.4 23.7-4.6 8-8.9 16-13 24-5.4-13.4-10-26.8-13.8-39.8 13.1-3.1 26.9-5.8 41.2-7.9zm-90.5 125.2c-35.4-15.1-58.3-34.9-58.3-50.6 0-15.7 22.9-35.6 58.3-50.6 8.6-3.7 18-7 27.7-10.1 5.7 19.6 13.2 40 22.5 60.9-9.2 20.8-16.6 41.1-22.2 60.6-9.9-3.1-19.3-6.5-28-10.2zM310 490c-13.6-7.8-19.5-37.5-14.9-75.7 1.1-9.4 2.9-19.3 5.1-29.4 19.6 4.8 41 8.5 63.5 10.9 13.5 18.5 27.5 35.3 41.6 50-32.6 30.3-63.2 46.9-84 46.9-4.5-.1-8.3-1-11.3-2.7zm237.2-76.2c4.7 38.2-1.1 67.9-14.6 75.8-3 1.8-6.9 2.6-11.5 2.6-20.7 0-51.4-16.5-84-46.6 14-14.7 28-31.4 41.3-49.9 22.6-2.4 44-6.1 63.6-11 2.3 10.1 4.1 19.8 5.2 29.1zm38.5-66.7c-8.6 3.7-18 7-27.7 10.1-5.7-19.6-13.2-40-22.5-60.9 9.2-20.8 16.6-41.1 22.2-60.6 9.9 3.1 19.3 6.5 28.1 10.2 35.4 15.1 58.3 34.9 58.3 50.6-.1 15.7-23 35.6-58.4 50.6zM320.8 78.4z" /><circle cx="420.9" cy="296.5" r="45.7" /><path d="M520.5 78.1z" />
          </Mui.SvgIcon> */}
          {/* <Mui.Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Mui.Typography
              variant="h6"
              noWrap
              component="div"
            >
              {intl.formatMessage({ defaultMessage: 'VISwap' })}
            </Mui.Typography>
          </Mui.Box> */}
          <Mui.Box  sx={{ flexGrow: 1 }} />
          {wallet.status === 'connected' && wallet.account ? (
            <Mui.Chip

              className="cn-custom-chip"
              label={wallet.account}
              variant="outlined"
              sx={{
                color: 'inherit',
                maxWidth: 105,
                '& .MuiChip-icon': { color: 'inherit' },
              }}
            />
          ) : (
            <Mui.Button className="cn-custom-btn" style={{textTransform: 'none'}} variant="contained" disableElevation onClick={() => { wallet.connect() }}>
              {intl.formatMessage({ defaultMessage: 'Connect Wallet' })}
            </Mui.Button>
          )}
          <Mui.IconButton
            sx={{ display: { xs: 'block', sm: 'none' } }}
            onClick={() => setMobileOpen(true)}
            edge="start"
            color="inherit">
            {/* <MenuIcon /> */}
            <img className="menu-toggle-icon" src={menuToggleIcon}></img>
          </Mui.IconButton>
        </Mui.Toolbar>
      </Mui.AppBar>
      <Mui.SwipeableDrawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onOpen={() => setMobileOpen(true)}
        disableSwipeToOpen
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 200 },
        }}
      >
        {drawer}
      </Mui.SwipeableDrawer>
      <Mui.Toolbar />
      <Mui.Container maxWidth={false} component="main" sx={{ position: 'relative', overflow: "inherit",height: '100%' }} className="w">
        <Mui.Drawer
          variant="permanent"
          sx={{
            width: { xs: 280, md: 280, xl: 280 },
            display: { xs: 'none', sm: 'block' },
            borderRadius: "12px",
            position: "absolute",
            top: 40,
            left: 0,
            minHeight: 874,
            padding: '32px 0',
            '& .MuiDrawer-paper': { boxSizing: 'border-box', borderRadius: "12px", border: 0, padding: '32px 0',minHeight: 874, width: { xs: 280, md: 280, xl: 280 }, position: "absolute" },
          }}
        >
          {/* <Mui.Toolbar /> */}
          {drawer}
        </Mui.Drawer>
        {/* <Mui.Toolbar /> */}
        <Mui.Container className="right_main" sx={{marginLeft: {xs: 0, sm: "320px"}, margin: {xs:"10px"}, width: 'auto'}}>
          <Switch>
            <Route exact path="/">
              <Home />
            </Route>
            <Route path="/mine">
              <MinePoolsProvider>
                <Mine />
              </MinePoolsProvider>
            </Route>
            <Route path="/swap">
              <TokenSelectionProvider key="swap">
                <Swap />
              </TokenSelectionProvider>
            </Route>
            <Route path="/liquidity">
              <TokenSelectionProvider key="liquidity">
                <Liquidity />
              </TokenSelectionProvider>
            </Route>
            <Route path="/dao">
              <Mui.Grid
                container
                alignItems="center"
                justifyContent="center"
                sx={{
                  p: 3,
                  minHeight: 'calc(100vh - 64px)'
                }}
              >
                <Mui.Grid item>
                  <Mui.Typography variant="h3" component="div">
                    {intl.formatMessage({ defaultMessage: 'Coming soon' })}
                  </Mui.Typography>
                </Mui.Grid>
              </Mui.Grid>
            </Route>
            <Route>
              <Redirect to="/" />
            </Route>
          </Switch>
        </Mui.Container>
      </Mui.Container>
      <Mui.Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={!wallet.ethereum}
      >
        <Mui.Alert
          severity="warning"
          elevation={6}
          variant="filled"
          action={
            <Mui.Button color="secondary" size="small" onClick={() => { wallet.connect() }}>
              {intl.formatMessage({ defaultMessage: 'Connect' })}
            </Mui.Button>
          }
          sx={{ width: '100%' }}>
          {intl.formatMessage({ defaultMessage: "Make sure your wallet is on {network} (ID:{chainId}) and connect to use." }, {
            network: <strong>{intl.formatMessage(chainOptions[wallet.chainId].networkName)}</strong>,
            chainId: wallet.chainId
          })}
        </Mui.Alert>
      </Mui.Snackbar>
    </Mui.Box>
  );
}
