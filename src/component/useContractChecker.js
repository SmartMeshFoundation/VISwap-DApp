import { useChain } from './Chain';
import { useWallet } from 'use-wallet';
import { useState, useEffect, useRef } from 'react';
import { BigNumber } from './utils';
import { BN2POW96, BNInfinity } from './utils'

export default function useContractChecker(data) {
  const chain = useChain()
  const wallet = useWallet()
  const [value, setValue] = useState()
  const valueRef = useRef()
  const requestIdRef = useRef(0)

  useEffect(() => {
    const set = (value) => {
      if(typeof(value) === 'object'){
          value = value.totalAmount
      }
      if (requestId === requestIdRef.current && value !== valueRef.current) {
        valueRef.current = value;
        setValue(new BigNumber(value).shiftedBy(- data.decimals))
      }
    }

    const requestId = requestIdRef.current;
    if (chain && wallet.account && typeof data.id !== 'undefined') {
      let check;
      switch (data.type) {
        case 'allowanceOfRouter':
          if (data.id === chain.eth.address) {
            valueRef.current = Infinity;
            setValue(BNInfinity)
            return () => { requestIdRef.current++ }
          } else {
            const erc20 = chain.contracts.erc20.clone()
            erc20.options.address = data.id
            check = () => erc20.methods.allowance(wallet.account, chain.contracts.router.options.address)
              .call()
              .then(set)
            break
          }
        case 'allowanceOfMine': {
          const erc20 = chain.contracts.erc20.clone()
          erc20.options.address = data.id
          check = () => erc20.methods.allowance(wallet.account, chain.contracts.mine.options.address)
            .call()
            .then(set)
          break
        }
        case 'balance':
          if (data.id === chain.eth.address) {
            check = () => chain.web3.eth.getBalance(wallet.account)
              .then(set)
          } else {
            const erc20 = chain.contracts.erc20.clone()
            erc20.options.address = data.id
            check = () => erc20.methods.balanceOf(wallet.account)
              .call()
              .then(set)
          }
          break
        case 'totalSupply':
          const erc20 = chain.contracts.erc20.clone()
          erc20.options.address = data.id
          check = () => erc20.methods.totalSupply()
            .call()
            .then(set)
          break
        case 'currentPrice':
          const pair = chain.contracts.pair.clone()
          pair.options.address = data.id
          check = () => pair.methods.getReserves().call()
            .then((value) => {
              if (requestId === requestIdRef.current && value !== valueRef.current) {
                valueRef.current = `${value._reserve0}_${value._reserve1}`;
                console.log("->>>>>>>",value._reserve1,value._reserve0)
                setValue(new BigNumber(value._reserve1).div(value._reserve0).shiftedBy(data.decimals0 - data.decimals1))
              }
            })
          break
        case 'pendingAllAmount':
          check = () => chain.contracts.mine.methods.pendingAllAmount(wallet.account)
            .call()
            .then(set)
          break
        case 'pendingAmount':
          check = () => chain.contracts.mine.methods.pendingAmount(data.id, wallet.account)
            .call()
            .then(set)
          break
        case 'depositedAmount':
          check = () => chain.contracts.mine.methods.depositedAmount(data.id, wallet.account)
            .call()
            .then(set)
          break
        case 'totalDepositedAmount': 
          check = () => chain.contracts.mine.methods.poolInfo(data.id)
            .call()
            .then(set)
          break
        case 'minedPerBlockByPool':
          check = () => chain.contracts.mine.methods.minedPerBlockByPool(data.id)
            .call()
            .then(set)
          break
        default:
          throw new Error(data.type)
      }

      check()
      const id = setInterval(check, data.interval || 5000)
      return () => { clearInterval(id); requestIdRef.current++ }
    } else {
      valueRef.current = undefined
      setValue()
      return () => { requestIdRef.current++ }
    }
  }, [chain, wallet.account, data.type, data.id, data.interval])

  return value;
}
