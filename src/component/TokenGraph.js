import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react'
import { useChain } from './Chain'

const constructTokenGraph = (graph) => ({
  tokens: { ...graph.tokens },
  pairs: { ...graph.pairs },
  paths: { ...graph.paths },
  pairsLength: graph.pairsLength,
  findAllRoutes: function (thisToken, otherToken, maxHops) {
    return this._findRoutes([], thisToken, otherToken, 0, maxHops)
  },
  _findRoutes: function (visited, startToken, endToken, depth, maxHops) {
    const routes = []
    if (!this.tokens.hasOwnProperty(startToken)) {
      return routes
    }
    visited.push(startToken)
    if (startToken === endToken) {
      routes.push(visited)
      return routes
    }
    if (depth >= maxHops) {
      return routes
    }
    for (const neighbToken in this.paths[startToken]) {
      if (visited.indexOf(neighbToken) === -1) {
        routes.push(...this._findRoutes([...visited], neighbToken, endToken, depth + 1, maxHops))
      }
    }
    return routes
  }
})

const initialTokenGraphData = {
  tokens: {}, // {${address}:{name, symbol, decimals, displayName}}
  pairs: {}, // {${address}:{decimals, token0, token1, index}}
  paths: {}, // {${thisTokenAddress}:{${otherTokenAddress}:pairAddress}}
  pairsLength: 0
}

const reducer = (originalTokenGraph, newTokenGraphData) => {
  if (originalTokenGraph.pairsLength !== 0 || newTokenGraphData.pairsLength !== 0) {
    return constructTokenGraph(newTokenGraphData)
  } else {
    return originalTokenGraph
  }
}

const TokenGraphContext = createContext()

export const useTokenGraph = () => useContext(TokenGraphContext)

export function TokenGraphProvider(props) {
  const chain = useChain()
  const _chain = useRef()
  const [tokenGraph, setTokenGraph] = useReducer(reducer, initialTokenGraphData, constructTokenGraph)

  const check = useCallback(async (chain, graph) => {
    if (_chain.current !== chain) {
      return
    }

    const tokens = graph.tokens
    const pairs = graph.pairs
    const paths = graph.paths

    const addPairToToken = async (thisToken, otherToken, pairAddr) => {
      if (tokens.hasOwnProperty(thisToken)) {
        paths[thisToken][otherToken] = pairAddr
      } else {
        tokens[thisToken] = {}
        paths[thisToken] = {}
        paths[thisToken][otherToken] = pairAddr

        const theErc20Contract = chain.contracts.erc20.clone()
        theErc20Contract.options.address = thisToken
        const [name, symbol, decimals] = await Promise.all([
          theErc20Contract.methods.name().call(),
          theErc20Contract.methods.symbol().call(),
          theErc20Contract.methods.decimals().call()
        ]);
        tokens[thisToken].name = name;
        tokens[thisToken].symbol = symbol;
        tokens[thisToken].decimals = parseInt(decimals) || 0;
        tokens[thisToken].displayName = symbol || name || thisToken;
      }
    }

    try {
      const currentPairsLength = await chain.contracts.factory.methods.allPairsLength().call()
      if (graph.pairsLength < currentPairsLength) {
        const promises = []
        for (let i = graph.pairsLength; i < currentPairsLength; i++) {
          promises.push(chain.contracts.factory.methods.allPairs(i).call().then(
            async (pairAddr) => {
              const thePairContract = chain.contracts.pair.clone()
              thePairContract.options.address = pairAddr
              const [decimals, token0, token1] = await Promise.all([
                thePairContract.methods.decimals().call(),
                thePairContract.methods.token0().call(),
                thePairContract.methods.token1().call()
              ]);
              pairs[pairAddr] = { decimals: parseInt(decimals), token0, token1, index: i }
              return await Promise.all([
                addPairToToken(token0, token1, pairAddr),
                addPairToToken(token1, token0, pairAddr)
              ]);
            }
          ))
        }
        await Promise.all(promises)
        graph.pairsLength = parseInt(currentPairsLength)
        localStorage.setItem(`tokenGraph_${chain.id}_${chain.contracts.router.options.address}`, JSON.stringify(graph))
        _chain.current === chain && setTokenGraph(graph)
      }
    } catch (err) {
      console.error(err)
    }

    setTimeout(check, 5000, chain, graph)
  }, [])

  useEffect(() => {
    if (chain) {
      _chain.current = chain
      const graph = localStorage.getItem(`tokenGraph_${chain.id}_${chain.contracts.router.options.address}`)
      setTokenGraph(graph ? JSON.parse(graph) : initialTokenGraphData)
      // check需要传入一个全新的对象
      check(chain, graph ? JSON.parse(graph) : { tokens: {}, pairs: {}, paths: {}, pairsLength: 0 })
    } else {
      setTokenGraph(initialTokenGraphData)
    }
    return () => { _chain.current = undefined }
  }, [chain, check])

  return (
    <TokenGraphContext.Provider value={tokenGraph}>
      {props.children}
    </TokenGraphContext.Provider>
  )
}
