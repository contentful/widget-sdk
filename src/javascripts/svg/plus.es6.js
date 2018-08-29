import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    width: '18',
    height: '18',
    viewBox: '-1 -1 20 20',
    xmlns: 'http://www.w3.org/2000/svg'
  },
  [
    h(
      'g',
      {
        fill: 'none',
        fillRule: 'evenodd'
      },
      [
        h('g', [
          h('g', [
            h('circle', {
              fill: '#21304A',
              cx: '9',
              cy: '9',
              r: '9'
            }),
            h('path', {
              d: 'M4 9h10M9 4v10',
              stroke: '#FFF',
              strokeWidth: '2',
              fill: '#FFF'
            })
          ])
        ])
      ]
    )
  ]
);
