import * as Mui from '@material-ui/core';
import { useMemo, useRef, useState ,useEffect} from 'react';
import { useIntl } from 'react-intl';
import { useWallet } from 'use-wallet';
import { useChain } from './Chain';
import useContractChecker from './useContractChecker';
import lineing from '../assets/lineing.svg'
import lineBegin from '../assets/line-begin.svg'
import lineEnd from '../assets/line-end.svg'

function ConnectButton() {
  const intl = useIntl()
  const wallet = useWallet()

  return (wallet.status !== 'connected' || !wallet.account) &&
    <Mui.Button onClick={() => wallet.connect()}>
      {intl.formatMessage({ defaultMessage: 'Connect to view' })}
    </Mui.Button>
}

function Item(props) {
  return (
    <>
      <Mui.Typography gutterBottom component="div" className="subtitle1">
        {props.value}
      </Mui.Typography>
      <Mui.Grid item container spacing={1} justifyContent="center" alignItems="center" wrap="nowrap">
        <Mui.Grid item>
          <Mui.Typography gutterBottom noWrap component="div" className="subtitle2">
            {props.name}
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item>
          <Mui.Typography gutterBottom component="div" className="subtitle2">
            ({props.unit})
          </Mui.Typography>
        </Mui.Grid>
      </Mui.Grid>
    </>
  )
}

export default function Home() {
  const intl = useIntl()
  const chain = useChain()
  const daoToken = useMemo(() => chain ? chain.dao : {}, [chain])
  const elementRef = useRef()

  const balance = useContractChecker({
    type: 'balance',
    id: daoToken.address,
    decimals: daoToken.decimals
  })
  const totalSupply = useContractChecker({
    type: 'totalSupply',
    id: daoToken.address,
    decimals: daoToken.decimals
  })
  const pendingAllAmount = useContractChecker({
    type: 'pendingAllAmount',
    id: daoToken.address,
    decimals: daoToken.decimals
  })
  const re = /([0-9]+\.[0-9]{2})[0-9]*/;

  const [isLoading, setLoading] = useState(true);
  const [totalLocked, setTotalLocked] = useState([0]);
  const [price, setPrice] = useState([0]);

  useEffect(() => {
    fetch('https://testnet.viswap.io/data/info.json')
      .then((response) => response.json())
      .then((json) => {setPrice(json.VIT_USD);setTotalLocked(json.totalLocked)})
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, []);
  return (
    <Mui.Container ref={elementRef} sx={{ padding: 0, margin:0,overflow: "hidden" }} className="home_page">
      
      <Mui.Grid container spacing={0} sx={{ marginTop: {xs: "20px", sm: "40px"},borderRadius: "6px", overflow: "hidden" }}>
        <Mui.Grid item width="100%">
          <Mui.Paper sx={{ mx: 'auto', boxShadow: "none" }}>
            <Mui.DialogTitle className="title_head">
              {intl.formatMessage({ defaultMessage: 'Overview' })}
            </Mui.DialogTitle>
            <Mui.DialogContent sx={{ pb: 3 }}>
            <Mui.Grid container spacing={3} sx={{padding: {xs:'10px 0',sm: '36px 0'}}}>
            <Mui.Grid item width="50%" md={4}>
              <Item
                name={intl.formatMessage({ defaultMessage: 'Total Supply' })}
                value={totalSupply ? totalSupply.toFixed() : "-"}
                unit={daoToken.displayName}
              />
            </Mui.Grid>
            <Mui.Grid item width="50%" md={4}>
              <Item
                name={intl.formatMessage({ defaultMessage: 'Total Locked' })}
                value={isLoading? "-" :totalLocked}
                unit="USD"
              />
            </Mui.Grid>
            <Mui.Grid item width="50%" md={4}>
              <Item
                name={intl.formatMessage({ defaultMessage: 'Price' })}
                value={isLoading? "-" :price}
                unit={daoToken.displayName ? `USD/${daoToken.displayName}` : "USD"}
              />
            </Mui.Grid>
            <Mui.Grid item width="50%" md={4}>
              <Item
                name={intl.formatMessage({ defaultMessage: 'Claimable' })}
                value={pendingAllAmount ? pendingAllAmount.toFixed().replace(re,"$1") : "-"}
                unit={daoToken.displayName}
              />
            </Mui.Grid>
            <Mui.Grid item width="50%" md={4}>
              <Item
                name={intl.formatMessage({ defaultMessage: 'Balance' })}
                value={balance ? balance.toFixed().replace(re,"$1") : "-"}
                unit={daoToken.displayName}
              />
            </Mui.Grid>
            </Mui.Grid>
            </Mui.DialogContent>
          </Mui.Paper>
        </Mui.Grid>
        <div className="box">
          <div className="title flex flex-vertical-center">
            <div className="circle"></div>
            <div className="name">Value Internet Swap Roadmap</div>
          </div>
          <div className="time-list">
            <div className="item flex">
              <div className="time">2021 Q1</div>
              <div className="line">
                <img className="ling-svg" src={lineEnd}></img>
                <div className="line-v"></div>
              </div>
              <div className="des">
                <div className="text">
                  Release distributed-notary module.
                </div>
                <div className="text">Support Cross-Chain between Ethereum and Spectrum.</div>
              </div>
            </div>
            <div className="item flex">
              <div className="time">2021 Q2</div>
              <div className="line">
                <img className="ling-svg" src={lineEnd}></img>
                <div className="line-v"></div>
              </div>
              <div className="des">
                <div className="text">
                  Launch the official website.
                </div>
                <div className="text">Publish Value Internet Swap Dos.</div>
                <div className="text">Support ERC-20 and ERC-721 Token Cross-Chain.</div>
                <div className="text">Launch HECO Swap.</div>
              </div>
            </div>
            <div className="item flex">
              <div className="time">2021 Q3</div>
              <div className="line">
                <img className="ling-svg" src={lineing}></img>
                <div className="line-v line-v-2"></div>
              </div>
              <div className="des">
                <div className="text">
                  Support Cross-Chain between Ethereum,Spectrum,BSC,HECO. 
                </div>
                <div className="text">Value Internet Swap Version 1 online.</div>
              </div>
            </div>
            <div className="item flex">
              <div className="time">2021 Q4</div>
              <div className="line">
                <img className="ling-svg" src={lineBegin}></img>
                <div className="line-v line-v-2"></div>
              </div>
              <div className="des">
                <div className="text">
                  Launch DAO Version 1.
                </div>
                <div className="text">Support POS distributed-notary.</div>
              </div>
            </div>
            <div className="item flex">
              <div className="time">2022</div>
              <div className="line">
                <img className="ling-svg" src={lineBegin}></img>
                <div className="line-v line-v-3"></div>
              </div>
              <div className="des">
                <div className="text">
                  Deploy aggregation protocol on Layer 2.
                </div>
              </div>
            </div>
          </div>
        </div>

      </Mui.Grid>
    </Mui.Container>
  )
}
