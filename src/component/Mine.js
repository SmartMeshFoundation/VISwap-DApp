import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as Mui from '@material-ui/core';
import { useIntl } from 'react-intl';
import InfoLine  from './InfoLine'
import InfoLine2  from './InfoLine2'
import { useChain } from './Chain';
import { useTokenGraph } from './TokenGraph';
import useContractChecker from './useContractChecker';
import { useWallet } from 'use-wallet';
import CloseIcon from '@material-ui/icons/Close';
import { Link } from './Router'
import '../styles/custom.css'
import ADDLIQUIDITY from '../assets/addliquidity.svg'
import HT from '../assets/ht.png'
import WHT from '../assets/wht.png'
import VIT from '../assets/vit.png'
import USDT from '../assets/usdt.png'
import DEFAULT from '../assets/default.png'

const MinePoolsContext = createContext()

export const useMinePools = () => useContext(MinePoolsContext)


function getImg(depositToken,tokenGraph,displayName,token0){

  if(token0)
  {
    if (depositToken.address in tokenGraph.pairs) {
      var token0 = DEFAULT; 
      const pair = tokenGraph.pairs[depositToken.address]
      switch(tokenGraph.tokens[pair.token0].displayName){
      case "HT":
      token0 = HT;
      break;
      case "WHT":
      token0 = WHT;
      break;
      case "VIT":
      token0 = VIT;
      break;
      case "USDT":
      token0 = USDT;
      break;
      default:
      token0 = DEFAULT;
      break;
      }

      return token0;
    } 
    else {
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
  }else{
    if (depositToken.address in tokenGraph.pairs) {
      const pair = tokenGraph.pairs[depositToken.address]
      var token1 = DEFAULT; 
      switch(tokenGraph.tokens[pair.token1].displayName){
      case "HT":
      token1 = HT;
      break;
      case "WHT":
      token1 = WHT;
      break;
      case "VIT":
      token1 = VIT;
      break;
      case "USDT":
      token1 = USDT;
      break;
      default:
      token1 = DEFAULT;
      break;
      }
      return token1;
    } 
  }
  

}

export function MinePoolsProvider(props) {
  const chain = useChain()
  const _chain = useRef()
  const [minePools, setMinePools] = useState([])

  const check = useCallback(async (chain, pools) => {
    if (_chain.current !== chain) {
      return
    }

    try {
      const currentLength = await chain.contracts.mine.methods.poolLength().call()
      if (pools.length < currentLength) {
        for (let i = pools.length; i < currentLength; i++) {
          const { depositToken } = await chain.contracts.mine.methods.poolInfo(i).call()
          const theErc20Contract = chain.contracts.erc20.clone()
          theErc20Contract.options.address = depositToken
          const [name, symbol, decimals] = await Promise.all([
            theErc20Contract.methods.name().call(),
            theErc20Contract.methods.symbol().call(),
            theErc20Contract.methods.decimals().call()
          ]);
          pools.push({
            depositToken: {
              address: depositToken,
              name,
              symbol,
              decimals: parseInt(decimals) || 0,
              displayName: symbol || name || depositToken
            },
            index: i
          })
          localStorage.setItem(`minePools_${chain.id}_${chain.contracts.mine.options.address}`, JSON.stringify(pools))
          _chain.current === chain && setMinePools(pools.slice())
        }
      }
    } catch (err) {
      console.error(err)
    }

    setTimeout(check, 5000, chain, pools)
  }, [])

  useEffect(() => {
    if (chain) {
      _chain.current = chain
      const pools = localStorage.getItem(`minePools_${chain.id}_${chain.contracts.mine.options.address}`)
      setMinePools(pools ? JSON.parse(pools) : [])
      // check需要传入一个全新的对象
      check(chain, pools ? JSON.parse(pools) : [])
    } else {
      setMinePools([])
    }
    return () => { _chain.current = undefined }
  }, [chain, check])

  return (
    <MinePoolsContext.Provider value={minePools}>
      {props.children}
    </MinePoolsContext.Provider>
  )
}

function ActiveMineItem(props) {
  const { depositToken, index, onClose } = props
  const intl = useIntl()
  const chain = useChain()
  const tokenGraph = useTokenGraph()
  const wallet = useWallet()
  const daoToken = useMemo(() => chain ? chain.dao : {}, [chain])
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const depositBalance = useContractChecker({
    type: 'balance',
    id: depositToken.address,
    decimals: depositToken.decimals
  })
  const depositAllowance = useContractChecker({
    type: 'allowanceOfMine',
    id: depositToken.address,
    decimals: depositToken.decimals
  })
  const depositedAmount = useContractChecker({
    type: 'depositedAmount',
    id: index,
    decimals: depositToken.decimals
  })
  const pendingAmount = useContractChecker({
    type: 'pendingAmount',
    id: index,
    decimals: daoToken.decimals
  })

  let depositDisplay;
  if (!parseFloat(depositAmount)) {
    depositDisplay = {
      buttonText: intl.formatMessage({ defaultMessage: 'Please Enter Amount' }),
      buttonVariant: "contained",
      buttonDisabled: true
    }
  } else if (!depositBalance || !depositAllowance) {
    depositDisplay = {
      buttonText: intl.formatMessage({ defaultMessage: 'Loading...' }),
      buttonVariant: "contained",
      buttonDisabled: true
    }
  } else if (depositBalance.lt(depositAmount)) {
    depositDisplay = {
      buttonText: intl.formatMessage({ defaultMessage: 'Insufficient Balance' }),
      buttonVariant: "contained",
      buttonDisabled: true
    }
  } else if (depositAllowance.lt(depositAmount)) {
    depositDisplay = {
      buttonText: intl.formatMessage({ defaultMessage: 'Approve' }, {
      }),
      buttonVariant: "outlined",
      buttonOnClick: () => chain.approveToMine(wallet.account, depositToken.address),
    }
  } else {
    depositDisplay = {
      buttonText: intl.formatMessage({ defaultMessage: 'Deposit' }),
      buttonVariant: "contained",
      buttonOnClick: () => chain.depositToPool(wallet.account, index, depositAmount, depositToken.decimals),
    }
  }


  let withdrawDisplay;
  if (!parseFloat(withdrawAmount)) {
    withdrawDisplay = {
      buttonText: intl.formatMessage({ defaultMessage: 'Pleace Enter Amount' }),
      buttonVariant: "contained",
      buttonDisabled: true
    }
  } else if (!depositedAmount) {
    withdrawDisplay = {
      buttonText: intl.formatMessage({ defaultMessage: 'Loading...' }),
      buttonVariant: "contained",
      buttonDisabled: true
    }
  } else if (depositedAmount.lt(withdrawAmount)) {
    withdrawDisplay = {
      buttonText: intl.formatMessage({ defaultMessage: 'Insufficient Balance' }),
      buttonVariant: "contained",
      buttonDisabled: true
    }
  } else {
    withdrawDisplay = {
      buttonText: intl.formatMessage({ defaultMessage: 'Withdraw' }),
      buttonVariant: "contained",
      buttonOnClick: () => chain.withdrawFromPool(wallet.account, index, withdrawAmount, depositToken.decimals),
    }
  }

  const displayName = useMemo(()=>{
    if (depositToken.address in tokenGraph.pairs) {
      const pair = tokenGraph.pairs[depositToken.address]
      return `LP(${tokenGraph.tokens[pair.token0].displayName}/${tokenGraph.tokens[pair.token1].displayName})`
    } else {
      return depositToken.displayName
    }
  }, [depositToken, tokenGraph])

  const re = /([0-9]+\.[0-9]{2})[0-9]*/;
  return (
    <>
      <Mui.DialogTitle disableTypography sx={{ position: 'relative' }}>
        <Mui.Typography variant="h6" component="div">
          {intl.formatMessage({ defaultMessage: 'Liquidity {token}' }, {
            token: displayName
          })}
        </Mui.Typography>
        <Mui.IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </Mui.IconButton>
      </Mui.DialogTitle>
      <Mui.DialogContent sx={{ pb: 3 }}>
        <InfoLine
          name={intl.formatMessage({ defaultMessage: 'Claimable' })}
          value={pendingAmount ? pendingAmount.toFixed().replace(re,"$1") : '–'}
          unit={daoToken.displayName}
        />
        <Mui.Button className="custom-btn" style={{textTransform: 'none'}} sx={{ mb: 1 }} fullWidth variant="outlined" onClick={() => chain.claimFromPool(wallet.account, index)} disabled={!pendingAmount || pendingAmount.eq(0)}>
          {intl.formatMessage({ defaultMessage: 'Claim' })}
        </Mui.Button>

         <InfoLine/>
          <InfoLine2
          name={intl.formatMessage({ defaultMessage: 'My Staking' })}
          value={depositedAmount ? depositedAmount.toFixed() : '–'}
        />
        <Mui.TextField
          label={intl.formatMessage({ defaultMessage: 'Amount' })}
          type="text"
          size="small"
          margin="normal"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(/^\d*\.?\d*$/.test(e.target.value) ? e.target.value : withdrawAmount)}
          fullWidth
          sx={{ mt: 1 }}
          InputProps={{
            endAdornment: <Mui.InputAdornment position="end">
              <Mui.Button color="secondary"  sx={{ mr: '-12px' }} size="small" onClick={() => setWithdrawAmount(depositedAmount.toFixed())} >
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
        <Mui.Button className="custom-btn" style={{textTransform: 'none'}} fullWidth variant={withdrawDisplay.buttonVariant} onClick={withdrawDisplay.buttonOnClick} disabled={withdrawDisplay.buttonDisabled}>
          {withdrawDisplay.buttonText}
        </Mui.Button>

        <InfoLine/>
        
        <Mui.Grid container justify="flex-start"  alignItems="center"  >
        {depositToken.address in tokenGraph.pairs &&
           <Mui.IconButton size = "small" component={Link} to={`/liquidity/add/${depositToken.address}`}>
            <img src={ADDLIQUIDITY}/>
           </Mui.IconButton>
        }
   
        {depositToken.address in tokenGraph.pairs &&
         <Mui.Typography  variant="h20" color= "secondary"  textAlign="center">
              Add Liquidity
         </Mui.Typography>
        }

        </Mui.Grid> 

        <InfoLine/>
        <InfoLine2
          name={intl.formatMessage({ defaultMessage: 'Deposit' })}
          value={depositBalance ? depositBalance.toFixed()  : '–'}
          
        />
        <Mui.TextField
          label={intl.formatMessage({ defaultMessage: 'Amount' })}
          type="text"
          size="small"
          margin="normal"
          value={depositAmount}
          onChange={(e) => setDepositAmount(/^\d*\.?\d*$/.test(e.target.value) ? e.target.value : depositAmount)}
          fullWidth
          sx={{ mt: 1 }}
          InputProps={{
            endAdornment: <Mui.InputAdornment position="end">
              <Mui.Button color="secondary" sx={{ mr: '-12px' }} size="small" onClick={() => setDepositAmount(depositBalance.toFixed())} >
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

        <Mui.Button className="custom-btn" style={{textTransform: 'none'}} sx={{ mb: 1 }}  fullWidth variant={depositDisplay.buttonVariant} onClick={depositDisplay.buttonOnClick} disabled={depositDisplay.buttonDisabled}>
          {depositDisplay.buttonText}
        </Mui.Button>
       
        
     
         
      
      </Mui.DialogContent>
    </>
  )
}

function MineItem(props) {
  
  const { depositToken, index, handleDepositClick} = props
  const intl = useIntl()
  const chain = useChain()
  const tokenGraph = useTokenGraph()
  const daoToken = useMemo(() => chain ? chain.dao : {}, [chain])
  const outputPerBlock = useContractChecker({
    type: 'minedPerBlockByPool',
    id: index,
    decimals: daoToken.decimals
  })
  const totalDepositedAmount = useContractChecker({
    type: 'totalDepositedAmount',
    id: index,
    decimals: depositToken.decimals
  })
  const depositedAmount = useContractChecker({
    type: 'depositedAmount',
    id: index,
    decimals: depositToken.decimals
  })
  const pendingAmount = useContractChecker({
    type: 'pendingAmount',
    id: index,
    decimals: daoToken.decimals
  })

  const displayName = useMemo(()=>{
    if (depositToken.address in tokenGraph.pairs) {
      const pair = tokenGraph.pairs[depositToken.address]
      return `LP(${tokenGraph.tokens[pair.token0].displayName}/${tokenGraph.tokens[pair.token1].displayName})`
    } else {
      return depositToken.displayName
    }
  }, [depositToken, tokenGraph])

  const [isLoading, setLoading] = useState(true);
  const [poolList, setPoolList] = useState([]);

  useEffect(() => {
    fetch('https://testnet.viswap.io/data/info.json')
      .then((response) => response.json())
      .then((json) => setPoolList(json.poolList))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, []);
  return (
    <Mui.Grid item width="100%" md={6} lg={4} sx={{ marginTop: {xs: "10px"},overflow: "hidden" ,boxShadow: "none" }}>
      <Mui.Card sx={{ maxWidth: 350, mx: 'auto' }} >
        <Mui.Grid m={1} container direction="row" justifyContent="center" alignItems="center" spacing={-2}>
        <Mui.Avatar  src={getImg(depositToken,tokenGraph,displayName,true)} sx={{ marginTop: {xs: "25px"}}}  />
         {
          getImg(depositToken,tokenGraph,displayName,false)&&<Mui.Avatar  visable="false" sx={{ marginTop: {xs: "25px"}}} src={getImg(depositToken,tokenGraph,displayName,false)} />
        }
        </Mui.Grid>
        <Mui.Typography   textAlign="center" fontWeight = "fontWeightMedium" style={{ fontSize: '20px' }}>
          {displayName}
         </Mui.Typography>
        <Mui.CardContent sx={{ p: 2, mt: 'auto' }}> 
        <Mui.Grid m={1} container direction="row" justifyContent="center" alignItems="center" spacing={-2}>
         <Mui.Chip
              className="cn-custom-chip"
              style={{ fontSize: '16px'}}
              label= {isLoading?"APY : ~%":"APY : "+poolList[index].apy}
              variant="outlined"
              sx={{

                color: 'inherit',
                '& .MuiChip-icon': { color: 'inherit' },
              }}
            />
         </Mui.Grid>
        
           
           <InfoLine />
           <InfoLine />
           <InfoLine />
           <InfoLine />
           <InfoLine 
            name={intl.formatMessage({ defaultMessage: 'TVL' })}
            unit={ '$'}
            value={isLoading?"~":poolList[index].tvl}
          />
          
          <InfoLine 
            name={intl.formatMessage({ defaultMessage: 'Weekly rewards' })}
            value={outputPerBlock ? outputPerBlock.toFixed()*20*60*7 : '–'}
            unit={intl.formatMessage({ defaultMessage: '{token}' }, {
              token: daoToken.displayName
            })}
          />
          
          <Mui.Grid container spacing={1}>
          
            <Mui.Grid item flexGrow={1}>
              <Mui.Button className="custom-btn" style={{textTransform: 'none'}} fullWidth variant="contained" onClick={handleDepositClick}>
                {intl.formatMessage({ defaultMessage: 'Select' })}
              </Mui.Button>
            </Mui.Grid>
          </Mui.Grid>
        </Mui.CardContent>
      </Mui.Card>
   
    </Mui.Grid>
  )
}

export default function Mine() {
  const [isLoading, setLoading] = useState(true);
  const [poolList1, setPoolList1] = useState([]);
  useEffect(() => {
    fetch('https://testnet.viswap.io/data/info.json')
      .then((response) => response.json())
      .then((json) => setPoolList1(json.poolList))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, []);

  const pools = useMinePools()
  const [activeMineItem, setActiveMineItem] = useState()
  const elementRef = useRef()
  return (
    <>
      <Mui.Container spacing={0}> 
        <Mui.Grid container spacing={2} sx={{ marginTop: {xs: "20px", sm: "15px" },overflow: "hidden" ,boxShadow: "none" }} >
          {pools.map((pool) => <MineItem  key =  {pool.index}  {...pool}  {...poolList1} handleDepositClick={() => setActiveMineItem(pool)} /> )}
        </Mui.Grid>
      </Mui.Container>
      <Mui.Dialog
        open={!!activeMineItem}
        onClose={() => setActiveMineItem()}
        maxWidth="xs"
        fullWidth
      >
      {activeMineItem && <ActiveMineItem onClose={() => setActiveMineItem()} {...activeMineItem} />}
      </Mui.Dialog>
    </>
  )
}
