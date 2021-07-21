import { createContext, useContext, useEffect, useState } from 'react'
import { useWallet } from 'use-wallet'
import FactoryABI from '../abi/factory.json'
import RouterABI from '../abi/router.json'
import WethABI from '../abi/weth.json'
import Erc20ABI from '../abi/erc20.json'
import PairABI from '../abi/pair.json'
import DaoABI from '../abi/dao.json'
import MineABI from '../abi/mine.json'
import Web3 from 'web3'
import { useMessage } from './Message'
import { BigNumber } from './utils'
import { defineMessage } from 'react-intl'

export const chainOptions = {
  256: {
    networkName: defineMessage({ defaultMessage: 'HECO Network' }),
    factory: '0x069a820eca119cceC6a26B1d1ae47aA64b9A1512',
    router: '0xFe9C926E35896B50bD1f202cC3aE129905dDE6a2',
    weth: '0x7af326b6351c8a9b8fb8cd205cbe11d4ac5fa836',
    mine: '0x6A4b52289baf199746a9c9A7343f8babd342682b',
    eth: {
      symbol: 'HT',
      name: 'HECO'
    },
    dao: {
      displayName: 'VIT',
      symbol: 'VIT',
      name: 'ViSwap',
      decimals: 18,
      address: '0xB15BF935207e8857CBa3B7F49baf104D1E2D567f'
    }
  }
}

const ChainContext = createContext()

export const useChain = () => useContext(ChainContext)

export function ChainProvider(props) {
  const wallet = useWallet()
  const [chain, setChain] = useState()
  const { wrapWeb3Request } = useMessage()

  useEffect(() => { wallet.connect() }, [wallet.chainId])

  useEffect(() => {
    if (wallet.ethereum) {
      const web3 = new Web3(wallet.ethereum)
      const chain = {
        id: wallet.chainId,
        web3,
        contracts: {
          erc20: new web3.eth.Contract(Erc20ABI),
          pair: new web3.eth.Contract(PairABI),
          router: new web3.eth.Contract(RouterABI, chainOptions[wallet.chainId].router),
          factory: new web3.eth.Contract(FactoryABI, chainOptions[wallet.chainId].factory),
          weth: new web3.eth.Contract(WethABI, chainOptions[wallet.chainId].weth),
          dao: new web3.eth.Contract(DaoABI, chainOptions[wallet.chainId].dao.address),
          mine: new web3.eth.Contract(MineABI, chainOptions[wallet.chainId].mine)
        },
        eth: {
          ...chainOptions[wallet.chainId].eth,
          address: `ETH-${wallet.chainId}`,
          weth: web3.utils.toChecksumAddress(chainOptions[wallet.chainId].weth),
          decimals: 18
        },
        dao: chainOptions[wallet.chainId].dao,
        approveToRouter: function (from, contract) {
          const erc20 = this.contracts.erc20.clone()
          erc20.options.address = contract
          wrapWeb3Request(
            erc20.methods.approve(this.contracts.router.options.address, this.web3.utils.toTwosComplement('-1'))
              .send({ from })
          )
        },
        approveToMine: function (from, contract) {
          const erc20 = this.contracts.erc20.clone()
          erc20.options.address = contract
          wrapWeb3Request(
            erc20.methods.approve(this.contracts.mine.options.address, this.web3.utils.toTwosComplement('-1'))
              .send({ from })
          )
        },
        depositWeth: function (from, amount) {
          wrapWeb3Request(
            this.contracts.weth.methods.deposit().send({
              from, value: new BigNumber(amount).shiftedBy(18).toFixed(0)
            })
          )
        },
        withdrawWeth: function (from, amount) {
          wrapWeb3Request(
            this.contracts.weth.methods.withdraw(new BigNumber(amount).shiftedBy(18).toFixed(0)).send({ from })
          )
        },
        depositToPool: function (from, index, amount, decimals) {
          wrapWeb3Request(
            this.contracts.mine.methods.deposit(index, new BigNumber(amount).shiftedBy(decimals).toFixed(0)).send({ from })
          )
        },
        withdrawFromPool: function (from, index, amount, decimals) {
          wrapWeb3Request(
            this.contracts.mine.methods.withdraw(index, new BigNumber(amount).shiftedBy(decimals).toFixed(0)).send({ from })
          )
        },
        claimFromPool: function (from, index) {
          wrapWeb3Request(
            this.contracts.mine.methods.claim(index).send({ from })
          )
        }
      }
      chain.eth.displayName = chain.eth.symbol || chain.eth.name || 'ETH';
      setChain(chain)
    } else {
      setChain()
    }
  }, [wallet.chainId, wallet.ethereum, wrapWeb3Request])

  return (
    <ChainContext.Provider value={chain}>
      {props.children}
    </ChainContext.Provider>
  )
}
