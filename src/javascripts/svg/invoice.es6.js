import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    xmlns: 'http://www.w3.org/2000/svg',
    width: '14',
    height: '15',
    viewBox: '0 0 14 15'
  },
  [
    h('path', {
      d:
        'M11.2 11.2h-9V9.8h9v1.4zm0-3h-9V6.8h9v1.4zm0-3h-9V3.8h9v1.4zM0 15l1.1-1.1L2.2 15l1.1-1.1L4.5 15l1.1-1.1L6.8 15l1.1-1.1L9 15l1.1-1.1 1.1 1.1 1.1-1.1 1.1 1.1V0l-1.1 1.1L11.2 0l-1.1 1.1L9 0 7.9 1.1 6.8 0 5.6 1.1 4.5 0 3.4 1.1 2.2 0 1.1 1.1 0 0v15z'
    })
  ]
);
