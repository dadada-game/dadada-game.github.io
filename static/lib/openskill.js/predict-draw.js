// import { flatten } from '/static/lib/ramda.min.js'
import constants from './constants.js'
import util, { sum } from './util.js'
import { phiMajor, phiMajorInverse } from './statistics.js'

const predictWin = (teams, options = {}) => {
  const { teamRating } = util(options)
  const { BETASQ, BETA } = constants(options)

  const n = teams.length
  if (n === 0) return undefined
  if (n === 1) return 1

  const denom = (n * (n - 1)) / (n > 2 ? 1 : 2)
  const teamRatings = teamRating(teams)
  const drawMargin =
    Math.sqrt(R.flatten(teams).length) * BETA * phiMajorInverse((1 + 1 / n) / 2)

  return (
    Math.abs(
      teamRatings
        .map(([muA, sigmaSqA], i) =>
          teamRatings
            .filter((_, q) => i !== q)
            .map(([muB, sigmaSqB]) => {
              const sigmaBar = Math.sqrt(
                n * BETASQ + sigmaSqA ** 2 + sigmaSqB ** 2
              )
              return (
                phiMajor((drawMargin - muA + muB) / sigmaBar) -
                phiMajor((muA - muB - drawMargin) / sigmaBar)
              )
            })
        )
        .flat()
        .reduce(sum, 0)
    ) / denom
  )
}

export default predictWin
