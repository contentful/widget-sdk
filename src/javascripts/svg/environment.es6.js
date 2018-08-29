import { h } from 'ui/Framework';

export default style =>
  h(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '12px',
      height: '12px',
      viewBox: '0 0 12 12',
      style
    },
    [
      h('path', {
        d:
          'M12,7.5l-1.7,1.7L8.1,7.1L7.1,8.1l2.2,2.2L7.5,12H12V7.5z M12,4.5V0H7.5l1.7,1.7L5.7,5.2H0v1.5h6.3l4-4L12,4.5z'
      })
    ]
  );
