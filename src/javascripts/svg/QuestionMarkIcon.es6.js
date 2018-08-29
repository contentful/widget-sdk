import { h } from 'ui/Framework';

/**
 * Question Mark icon that is aligned vertically for inline display.
 *
 * By default it uses the current color of the container for the fill
 * color. This can be customized through the argument.
 */
export default function({ color = 'currentColor' } = {}) {
  return h(
    'svg',
    {
      style: {
        // To align this vertically
        transform: 'translateY(3px)'
      },
      xmlns: 'http://www.w3.org/2000/svg',
      width: '15',
      height: '15',
      viewBox: '0 0 15 15'
    },
    [
      h('path', {
        d:
          'M7.5 0C3.4 0 0 3.4 0 7.5S3.4 15 7.5 15 15 11.6 15 7.5 11.6 0 7.5 0zm.7 12.8H6.8v-1.5h1.5v1.5zm1.6-5.9l-.7.7c-.5.5-.9 1-.9 2.1H6.8v-.3c0-.8.3-1.6.9-2.1l.9-.9c.2-.4.4-.7.4-1.2 0-.8-.7-1.5-1.5-1.5S6 4.4 6 5.2H4.5c0-1.7 1.3-3 3-3s3 1.3 3 3c0 .7-.3 1.3-.7 1.7z',
        fill: color
      })
    ]
  );
}
