import {h} from 'ui/Framework';

export default h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  width: '18',
  height: '18',
  viewBox: '-1 -1 20 20'
}, [
  h('path', {
    d: 'M12.9 6.8l-3.3-5c-.1-.2-.4-.3-.6-.3s-.5.1-.6.3l-3.3 5H1.5c-.4 0-.8.3-.8.8v.2l1.9 7c.2.6.8 1.1 1.4 1.1h9.8c.7 0 1.3-.5 1.4-1.1l1.9-7v-.2c0-.4-.3-.8-.8-.8h-3.4zm-6.1 0L9 3.4l2.2 3.3H6.8zm2.2 6c-.8 0-1.5-.7-1.5-1.5S8.2 9.8 9 9.8s1.5.7 1.5 1.5-.7 1.5-1.5 1.5z'
  })
]);
