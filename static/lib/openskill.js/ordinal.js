import constants from './constants.js'

const ordinal = ({ sigma, mu }, options = {}) => {
  const { Z } = constants(options)
  return mu - Z * sigma
}

export default ordinal
