import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    xmlns: 'http://www.w3.org/2000/svg',
    width: '18',
    height: '18',
    viewBox: '0 0 18 18'
  },
  [
    h(
      'g',
      {
        fill: '#8091A5',
        fillRule: 'evenodd'
      },
      [
        h('path', {
          d: 'M1.929 17.999v-3.651H14.4v3.651z'
        }),
        h('circle', {
          cx: '4.783',
          cy: '7.354',
          r: '4.783'
        }),
        h('path', {
          d: 'M18.001 14.194L9.772.206h8.229z'
        })
      ]
    )
  ]
);
