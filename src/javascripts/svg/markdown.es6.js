import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '-1 -1 25 16'
  },
  [
    h('path', {
      fillRule: 'evenodd',
      clipRule: 'evenodd',
      fill: '#546272',
      d:
        'M20.2 7H18V3.3h-2.2V7h-2.2l3.3 3.8L20.2 7zM5.6 10.7V6.5l2.2 2.7L10 6.5v4.3h2.2V3.3H10L7.8 6 5.6 3.3H3.4v7.4h2.2zM21.2 14H1.8c-.9 0-1.6-.7-1.6-1.6V1.6C.2.7.9 0 1.8 0h19.4c.9 0 1.6.7 1.6 1.6v10.7c0 1-.7 1.7-1.6 1.7z'
    })
  ]
);
