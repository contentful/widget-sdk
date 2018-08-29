import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    xmlns: 'http://www.w3.org/2000/svg',
    width: '17',
    height: '12',
    viewBox: '0 0 17 12'
  },
  [
    h('path', {
      fill: '#5697E3',
      d:
        'M8.576 7.547h-.542l-.192-.185A4.438 4.438 0 0 0 8.92 4.46a4.46 4.46 0 1 0-4.46 4.46c1.104 0 2.12-.405 2.902-1.078l.185.192v.542L10.977 12 12 10.978l-3.424-3.43zm-4.116 0A3.083 3.083 0 0 1 1.372 4.46c0-1.71 1.38-3.088 3.088-3.088A3.084 3.084 0 0 1 7.547 4.46 3.084 3.084 0 0 1 4.46 7.547zM17 6.75h-2.25V9h-1.5V6.75H11v-1.5h2.25V3h1.5v2.25H17v1.5z'
    })
  ]
);
