import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    xmlns: 'http://www.w3.org/2000/svg',
    width: '24',
    height: '20',
    viewBox: '-1 -1 26 22',
    fill: '#FFF'
  },
  [
    h('path', {
      d:
        'M20.5 20H3c-1.7 0-3-1.3-3-3V.5C0 .2.2 0 .5 0h7c.3 0 .5.2.5.5V2h12.5c.3 0 .5.2.5.5V4h2.5c.3 0 .5.2.5.5v12c0 1.9-1.6 3.5-3.5 3.5zM5.2 19h15.3c1.4 0 2.5-1.1 2.5-2.5V5H6v12c0 .8-.3 1.5-.8 2zM1 1v16c0 1.1.9 2 2 2s2-.9 2-2V4.5c0-.3.2-.5.5-.5H20V3H7.5c-.3 0-.5-.2-.5-.5V1H1z'
    })
  ]
);
