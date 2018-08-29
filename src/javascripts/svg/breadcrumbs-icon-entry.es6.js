import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    xmlns: 'http://www.w3.org/2000/svg',
    width: '16',
    height: '16',
    viewBox: '-1 -1 18 18',
    'xmlns:xlink': 'http://www.w3.org/1999/xlink'
  },
  [
    h('defs', [
      h('rect#breadcrumbs-icon-entry--a', {
        width: '16',
        height: '16',
        rx: '2'
      }),
      h(
        'mask#breadcrumbs-icon-entry--b',
        {
          width: '16',
          height: '16',
          x: '0',
          y: '0',
          fill: '#fff'
        },
        [
          h('use', {
            'xlink:href': '#breadcrumbs-icon-entry--a'
          })
        ]
      )
    ]),
    h(
      'g',
      {
        fill: 'none',
        fillRule: 'evenodd',
        stroke: '#A9B9C0'
      },
      [
        h('use', {
          strokeWidth: '2',
          mask: 'url(#breadcrumbs-icon-entry--b)',
          'xlink:href': '#breadcrumbs-icon-entry--a'
        }),
        h('path', {
          d: 'M3.7 4.2h8.6M3.7 6.9h8.6M3.7 9.6h8.6m-8.6 2.5h6.5',
          strokeLinecap: 'round',
          strokeLinejoin: 'round'
        })
      ]
    )
  ]
);
