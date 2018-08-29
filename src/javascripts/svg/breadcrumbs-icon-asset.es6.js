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
      h('rect#breadcrumbs-icon-assets--a', {
        width: '16',
        height: '15.59',
        y: '.2',
        rx: '2'
      }),
      h(
        'mask#breadcrumbs-icon-assets--b',
        {
          width: '16',
          height: '15.59',
          x: '0',
          y: '0',
          fill: '#fff'
        },
        [
          h('use', {
            'xlink:href': '#breadcrumbs-icon-assets--a'
          })
        ]
      )
    ]),
    h(
      'g',
      {
        fill: 'none',
        fillOpacity: '0',
        fillRule: 'evenodd',
        stroke: '#A9B9C0'
      },
      [
        h('use', {
          fill: '#FFF',
          strokeWidth: '2',
          mask: 'url(#breadcrumbs-icon-assets--b)',
          'xlink:href': '#breadcrumbs-icon-assets--a'
        }),
        h('path', {
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          d: 'M.5 9.574l5.001-4.001 7.015 9.714M9.501 10.074l2-2 3.837 3.635'
        }),
        h('ellipse', {
          cx: '10.251',
          cy: '4.323',
          rx: '1.25',
          ry: '1.25'
        })
      ]
    )
  ]
);
