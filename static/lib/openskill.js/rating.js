import { mu as defaultMu, sigma as defaultSigma } from './constants.js'

const rating = ({ mu, sigma } = {}, options = {}) => ({
  mu: mu ?? defaultMu(options),
  sigma: sigma ?? defaultSigma({ ...options, mu }),
})

export default rating
