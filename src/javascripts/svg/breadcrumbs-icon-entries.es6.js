import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    xmlns: 'http://www.w3.org/2000/svg',
    width: '18',
    height: '18',
    viewBox: '-1 -1 20 20',
    'xmlns:xlink': 'http://www.w3.org/1999/xlink'
  },
  [
    h('defs', [
      h('path#breadcrumbs-icon-entries--a', {
        d:
          'M2 4.567v-.57A2 2 0 0 1 4.004 2H15.99C17.1 2 18 2.895 18 3.994v12.012C18 17.107 17.1 18 16.006 18h-.356'
      }),
      h(
        'mask#breadcrumbs-icon-entries--c',
        {
          width: '16',
          height: '16',
          x: '0',
          y: '0',
          fill: '#fff'
        },
        [
          h('use', {
            'xlink:href': '#breadcrumbs-icon-entries--a'
          })
        ]
      ),
      h('rect#breadcrumbs-icon-entries--b', {
        width: '16',
        height: '16',
        rx: '2'
      }),
      h(
        'mask#breadcrumbs-icon-entries--d',
        {
          width: '16',
          height: '16',
          x: '0',
          y: '0',
          fill: '#fff'
        },
        [
          h('use', {
            'xlink:href': '#breadcrumbs-icon-entries--b'
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
          mask: 'url(#breadcrumbs-icon-entries--c)',
          transform: 'rotate(90 10 10)',
          'xlink:href': '#breadcrumbs-icon-entries--a'
        }),
        h('use', {
          strokeWidth: '2',
          mask: 'url(#breadcrumbs-icon-entries--d)',
          'xlink:href': '#breadcrumbs-icon-entries--b'
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
