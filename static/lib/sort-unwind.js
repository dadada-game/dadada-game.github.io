// import {
//   addIndex,
//   map,
//   pipe,
//   prop,
//   sortBy,
//   transpose,
//   uncurryN,
//   zip,
// } from '/static/lib/ramda.min.js'

export default R.uncurryN(2, (rank) =>
  R.pipe(
    R.addIndex(R.map)((element, idx) => [element, idx]),
    R.zip(rank),
    R.sortBy(R.prop(0)), // O(log n)
    R.map(R.prop(1)),
    R.transpose
  )
)
