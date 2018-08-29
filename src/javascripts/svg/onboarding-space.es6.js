import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    xmlns: 'http://www.w3.org/2000/svg',
    width: '40',
    height: '40',
    viewBox: '-1 -1 42 42'
  },
  [
    h(
      'g',
      {
        fill: 'none',
        fillRule: 'evenodd'
      },
      [
        h('path', {
          d: 'M0 0h40v40H0z'
        }),
        h('path', {
          fill: '#21304A',
          d:
            'M18.492 7.274h19.51c1.104 0 1.998.893 1.998 2v24.28c0 1.105-.892 2-1.997 2H1.997a1.997 1.997 0 0 1-1.997-2V6.453c0-1.109.891-2.006 1.993-2.004l13.744.024 2.755 2.8z'
        }),
        h('path', {
          fill: '#A7E2FF',
          d: 'M1.886 9.461h36.229v23.906H1.886z'
        })
      ]
    )
  ]
);
