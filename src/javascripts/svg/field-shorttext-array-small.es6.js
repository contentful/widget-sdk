import {h} from 'ui/Framework';

export default h('svg', {
  width: '33',
  height: '33',
  viewBox: '-1 -1 35 35',
  xmlns: 'http://www.w3.org/2000/svg'
}, [
  h('g', {
    fill: 'none',
    fillRule: 'evenodd'
  }, [
    h('g', [
      h('g', [
        h('rect', {
          stroke: '#21304A',
          fill: 'none',
          width: '30',
          height: '30',
          rx: '5'
        }),
        h('path', {
          d: 'M5 31.432a5.972 5.972 0 0 0 3.746 1.314h18.002a6 6 0 0 0 5.999-5.999V8.745A5.973 5.973 0 0 0 31.434 5a5.01 5.01 0 0 1 .313 1.75v19.992a4.998 4.998 0 0 1-5.005 5.004H6.752c-.617 0-1.207-.11-1.752-.314z',
          fill: '#21304A'
        }),
        h('path', {
          d: 'M6.76 21.096H5L9.912 9.768h1.44l4.864 11.328h-1.792l-1.152-2.784H7.896L6.76 21.096zm1.696-4.176h4.24l-2.112-5.312-2.128 5.312zm10.624 2.976v1.2h-1.456V9h1.504v5.648h.048c.256-.373.613-.69 1.072-.952.459-.261 1.003-.392 1.632-.392.565 0 1.08.101 1.544.304.464.203.864.485 1.2.848.336.363.595.787.776 1.272.181.485.272 1.005.272 1.56 0 .555-.09 1.077-.272 1.568-.181.49-.437.917-.768 1.28-.33.363-.73.648-1.2.856a3.87 3.87 0 0 1-1.584.312c-.544 0-1.061-.12-1.552-.36-.49-.24-.885-.59-1.184-1.048h-.032zm5.04-2.608c0-.352-.053-.693-.16-1.024a2.612 2.612 0 0 0-.48-.88 2.298 2.298 0 0 0-.792-.608 2.53 2.53 0 0 0-1.096-.224 2.413 2.413 0 0 0-1.856.832c-.224.256-.397.55-.52.88-.123.33-.184.677-.184 1.04s.061.71.184 1.04c.123.33.296.621.52.872.224.25.493.45.808.6.315.15.664.224 1.048.224.416 0 .781-.077 1.096-.232.315-.155.579-.36.792-.616.213-.256.373-.55.48-.88.107-.33.16-.672.16-1.024z',
          fill: '#000'
        })
      ])
    ])
  ])
]);
