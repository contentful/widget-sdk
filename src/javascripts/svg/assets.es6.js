import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    xmlns: 'http://www.w3.org/2000/svg',
    'xmlns:xlink': 'http://www.w3.org/1999/xlink',
    width: '16',
    height: '16',
    viewBox: '-1 -1 18 18'
  },
  [
    h('defs', [
      h('rect#assets-a', {
        width: '13.665',
        height: '13.314',
        y: '2.175',
        rx: '2'
      }),
      h(
        'mask#assets-mask',
        {
          width: '13.665',
          height: '13.314',
          x: '0',
          y: '0',
          fill: '#fff'
        },
        [
          h('use', {
            'xlink:href': '#assets-a'
          })
        ]
      ),
      h('mask#c', [
        h('rect', {
          width: '100%',
          height: '100%',
          fill: '#fff'
        }),
        h('use', {
          'xlink:href': '#assets-a'
        })
      ])
    ]),
    h(
      'g',
      {
        fill: 'none',
        fillRule: 'evenodd',
        stroke: 'currentColor'
      },
      [
        h('use', {
          strokeWidth: '2',
          mask: 'url(#assets-mask)',
          'xlink:href': '#assets-a'
        }),
        h('path', {
          mask: 'url(#c)',
          fill: 'currentColor',
          fillOpacity: '.1',
          d:
            'M2 2.173v.007C2 1.073 2.897.175 4.002.175h9.661c1.106 0 2.002.894 2.002 1.994v9.327c0 1.101-.905 1.994-2.01 1.994H13.6'
        }),
        h('g', [
          h('path', {
            d: 'M.438 10.376l4.375-3.5 5.687 7.875M8.313 10.813l1.75-1.75 3.062 2.735'
          })
        ]),
        h('circle', {
          cx: '9',
          cy: '5.8',
          r: '1.1'
        })
      ]
    )
  ]
);
