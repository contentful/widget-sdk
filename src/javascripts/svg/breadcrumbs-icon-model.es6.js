import {h} from 'ui/Framework';

export default h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  width: '18',
  height: '18',
  viewBox: '-1 -1 20 20'
}, [
  h('path', {
    fill: 'none',
    stroke: '#A9B9C0',
    d: 'M3.203 7.155L1.23 8.353c-.295.18 0 .65 0 .65l7.238 4.4c.277.167.715.178 1.012.031-.297.152-.741.143-1.021-.027l-5.22-3.172-2.109 1.281c-.295.18 0 .651 0 .651l7.238 4.398c.296.18.776.18 1.071 0l7.238-4.398c.296-.18.296-.471 0-.65l-2.017-1.227 2.117-1.286c.296-.18.296-.471 0-.651l-1.98-1.204 1.97-1.21c.296-.182.296-.476 0-.658L9.532.836c-.296-.181-.776-.181-1.071 0L1.222 5.281c-.296.182-.296.476 0 .658l1.98 1.216zM14.66 10.29l-5.13 3.117a.759.759 0 0 1 .01-.005l5.12-3.112zM3.203 7.155l.002-.001 5.255 3.193c.296.18.775.18 1.07 0l5.265-3.199.002.001-5.266 3.235c-.296.181-.775.181-1.071 0L3.203 7.155z'
  })
]);
