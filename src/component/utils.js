import BigNumber from 'bignumber.js'

BigNumber.prototype.toMaxDecimals = function(decimals){
  return this.dp(decimals || 0).toFixed()
}

export const BN0 = new BigNumber(0)
export const BN1 = new BigNumber(1)
export const BN2POW96 = new BigNumber(2).pow(96)
export const BNInfinity = new BigNumber(Infinity)

export { BigNumber }