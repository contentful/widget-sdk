import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    xmlns: 'http://www.w3.org/2000/svg',
    width: '17',
    height: '17',
    viewBox: '-1 -1 19 19',
    'xmlns:xlink': 'http://www.w3.org/1999/xlink'
  },
  [
    h('defs', [
      h('path#plus-2--plus-segment', {
        fill: 'currentColor',
        d: 'M7.5 4.5h2v8h-2z'
      })
    ]),
    h(
      'g',
      {
        fill: 'currentColor'
      },
      [
        h('g', [
          h('circle', {
            cx: '8.5',
            cy: '8.5',
            r: '49%',
            opacity: '.5',
            filter: 'url(#plus-2--a)'
          }),
          h('circle', {
            cx: '8.5',
            cy: '8.5',
            r: '46%',
            stroke: 'currentColor',
            fill: 'transparent',
            filter: 'url(#plus-2--b)'
          })
        ]),
        h('g', [
          h('use', {
            'xlink:href': '#plus-2--plus-segment'
          }),
          h('use', {
            'xlink:href': '#plus-2--plus-segment',
            transform: 'rotate(-90 8.5 8.5)'
          })
        ])
      ]
    ),
    h('filter#plus-2--a', [
      h('feColorMatrix', {
        in: 'SourceGraphic',
        type: 'saturate',
        values: '1.1'
      }),
      h('feComponentTransfer', [
        h('feFuncR', {
          type: 'gamma',
          exponent: '.2'
        }),
        h('feFuncG', {
          type: 'gamma',
          exponent: '.2'
        }),
        h('feFuncB', {
          type: 'gamma',
          exponent: '.2'
        })
      ])
    ]),
    h('filter#plus-2--b', [
      h('feColorMatrix', {
        in: 'SourceGraphic',
        type: 'saturate',
        values: '1.05'
      }),
      h('feComponentTransfer', [
        h('feFuncR', {
          type: 'gamma',
          exponent: '.8'
        }),
        h('feFuncG', {
          type: 'gamma',
          exponent: '.8'
        }),
        h('feFuncB', {
          type: 'gamma',
          exponent: '.8'
        })
      ])
    ])
  ]
);
