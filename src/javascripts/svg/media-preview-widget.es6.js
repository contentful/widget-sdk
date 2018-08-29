import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    width: '68',
    height: '47',
    viewBox: '-1 -1 70 49',
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
          h(
            'g',
            {
              transform: 'translate(1)'
            },
            [
              h('path', {
                fill: '#D6DCE4',
                d: 'M.5.5h64.786V45H.5z'
              }),
              h('circle', {
                stroke: '#FFF',
                strokeWidth: '2',
                cx: '53',
                cy: '12',
                r: '6'
              }),
              h('path', {
                d: 'M.571 32.256l19-18 25 30.5M38.571 37.256L49.711 27 65.5 41.256',
                stroke: '#FFF',
                strokeWidth: '2',
                strokeLinecap: 'square'
              })
            ]
          )
        ])
      ]
    )
  ]
);
