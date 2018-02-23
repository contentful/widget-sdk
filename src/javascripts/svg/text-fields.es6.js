import { h } from 'ui/Framework';

export default h('svg', {
  fill: '#3C80CF',
  height: '20',
  viewBox: '0 0 24 24',
  width: '20',
  xmlns: 'http://www.w3.org/2000/svg',
  'xmlns:xlink': 'http://www.w3.org/1999/xlink'
}, [
  h('defs', [
    h('path', {
      d: 'M24 24H0V0h24v24z',
      id: 'a'
    })
  ]),
  h('clipPath', {
    id: 'b'
  }, [
    h('use', {
      overflow: 'visible',
      'xlink:href': '#a'
    })
  ]),
  h('path', {
    'clip-path': 'url(#b)',
    d: 'M2.5 4v3h5v12h3V7h5V4h-13zm19 5h-9v3h3v7h3v-7h3V9z'
  })
]);
