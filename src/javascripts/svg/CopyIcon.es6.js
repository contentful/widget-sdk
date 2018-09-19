import React from 'react';

/**
 * Icon that indicates possibility to copy and paste somethign. It is
 * aligned vertically for inline display.
 *
 * By default it uses the current color of the container for the fill
 * color. This can be customized through the argument.
 */
export default ({ color = 'currentColor' } = {}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="17"
    viewBox="0 0 15 17"
    style={{
      // Align vertically to fit with baseline
      transform: 'translateY(4px)'
    }}>
    <path
      fill={color}
      d="M10.9.2h-9C1.1.2.4.9.4 1.7v10.5h1.5V1.8h9V.2zm2.2 3H4.9c-.8 0-1.5.7-1.5 1.5v10.5c0 .8.7 1.5 1.5 1.5h8.2c.8 0 1.5-.7 1.5-1.5V4.8c0-.9-.6-1.6-1.5-1.6zm0 12H4.9V4.8h8.2v10.4z"
    />
  </svg>
);
