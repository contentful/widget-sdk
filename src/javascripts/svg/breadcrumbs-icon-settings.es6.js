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
      h('path#breadcrumbs-icon-settings--a', {
        d:
          'M15 6.5l-1.3-.3c-.1-.3-.25-.65-.4-.9l.7-1.15c.25-.4.4-1 0-1.4L13.35 2c-.4-.4-1.05-.3-1.45-.05l-1.15.7c-.3-.15-.6-.3-.9-.4L9.55 1c-.1-.5-.5-1-1.05-1h-1c-.55 0-.9.5-1 1l-.3 1.3c-.35.1-.65.25-.95.4l-1.2-.75C3.65 1.7 3 1.6 2.6 2l-.7.7c-.4.4-.25 1 0 1.4l.75 1.2c-.15.3-.25.55-.35.85L1 6.5c-.5.1-1 .5-1 1.05v1c0 .55.5.9 1 1l1.3.3c.1.3.2.55.35.8l-.75 1.2c-.25.4-.4 1 0 1.4l.7.75c.4.4 1.05.3 1.45.05l1.15-.75c.3.15.65.3 1 .4l.3 1.3c.1.5.45 1 1 1h1c.55 0 .95-.5 1.05-1l.3-1.3c.3-.1.6-.25.9-.4l1.15.7c.4.3 1.05.35 1.45-.05l.7-.7c.4-.4.25-1 0-1.4l-.7-1.15c.15-.25.25-.55.35-.85l1.3-.3c.5-.1 1-.45 1-1v-1c0-.55-.5-1-1-1.05z'
      }),
      h(
        'mask#breadcrumbs-icon-settings--b',
        {
          width: '16',
          height: '16',
          x: '0',
          y: '0',
          fill: '#fff'
        },
        [
          h('use', {
            'xlink:href': '#breadcrumbs-icon-settings--a'
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
        h('path', {
          d:
            'M7.9 10.5A2.507 2.507 0 0 1 5.4 8c0-1.375 1.125-2.5 2.5-2.5s2.5 1.125 2.5 2.5-1.125 2.5-2.5 2.5z'
        }),
        h('use', {
          strokeWidth: '2',
          mask: 'url(#breadcrumbs-icon-settings--b)',
          'xlink:href': '#breadcrumbs-icon-settings--a'
        })
      ]
    )
  ]
);
