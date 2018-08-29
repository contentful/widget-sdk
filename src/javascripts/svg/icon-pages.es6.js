import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    width: '23',
    height: '25',
    viewBox: '0 0 23 25',
    xmlns: 'http://www.w3.org/2000/svg'
  },
  [
    h('title', ['Pages icon']),
    h(
      'g',
      {
        fill: 'none',
        fillRule: 'evenodd'
      },
      [
        h('path', {
          d: 'M0 1h24v24H0z'
        }),
        h('path', {
          stroke: '#0EB87F',
          d: 'M3.5.5h19v21h-19z'
        }),
        h('path', {
          fill: '#FFF',
          d: 'M0 3h20v22H0z'
        }),
        h('path', {
          stroke: '#0EB87F',
          d: 'M.5 3.5h19v21H.5z'
        }),
        h('path', {
          stroke: '#C0F2D6',
          d:
            'M3.5 6.5h13v1h-13zM3.5 9.5h13v1h-13zM10.5 15.5h6v1h-6zM3.5 12.5h13v1h-13zM10.5 18.5h6v1h-6zM3.5 21.5h13v1h-13z'
        }),
        h('path', {
          fill: '#C0F2D6',
          d: 'M3 15h6v4H3z'
        })
      ]
    )
  ]
);
