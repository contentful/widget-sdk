import {h} from 'ui/Framework';

export default function ({ fill }) {
  return h('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    width: '18',
    height: '18',
    viewBox: '0 0 18 18'
  }, [
    h('path', {
      fill,
      d: 'M2.2 13.5h13.5V12H2.2v1.5zm0-3.7h13.5V8.2H2.2v1.6zm0-5.3V6h13.5V4.5H2.2z'
    })
  ]);
}
