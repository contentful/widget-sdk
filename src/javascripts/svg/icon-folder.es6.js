import {h} from 'ui/Framework';

export default h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  width: '15',
  height: '12',
  viewBox: '0 0 15 12'
}, [
  h('path', {
    d: 'M6 0H1.5C.7 0 0 .7 0 1.5v9c0 .8.7 1.5 1.5 1.5h12c.8 0 1.5-.7 1.5-1.5V3c0-.8-.7-1.5-1.5-1.5h-6L6 0z'
  })
]);
