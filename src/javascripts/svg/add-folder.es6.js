import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    xmlns: 'http://www.w3.org/2000/svg',
    width: '15',
    height: '12',
    viewBox: '0 0 15 12'
  },
  [
    h('path', {
      fill: '#5697E3',
      d:
        'M13.5 1.5h-6L6 0H1.5C.668 0 .008.668.008 1.5L0 10.5c0 .832.668 1.5 1.5 1.5h12c.833 0 1.5-.668 1.5-1.5V3c0-.832-.667-1.5-1.5-1.5zm-.75 6H10.5v2.25H9V7.5H6.75V6H9V3.75h1.5V6h2.25v1.5z'
    })
  ]
);
