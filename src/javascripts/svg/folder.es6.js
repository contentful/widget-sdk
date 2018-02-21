import {h} from 'ui/Framework';

export default h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  width: '15px',
  height: '12px',
  viewBox: '0 0 15 12',
  space: 'preserve',
  style: {
    name: 'style',
    value: 'enable-background:new 0 0 15 12'
  }
}, [
  h('path', {
    d: 'M13.5,1.5h-6L6,0H1.5C0.7,0,0,0.7,0,1.5l0,9C0,11.3,0.7,12,1.5,12h12c0.8,0,1.5-0.7,1.5-1.5V3C15,2.2,14.3,1.5,13.5,1.5z\n\tM13.5,10.5h-12V3h12V10.5z'
  })
]);
