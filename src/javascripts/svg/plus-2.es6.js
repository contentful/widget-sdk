import React from 'react';

export default () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="17"
    height="17"
    viewBox="-1 -1 19 19"
    xmlnsXlink="http://www.w3.org/1999/xlink">
    <defs>
      <path fill="currentColor" d="M7.5 4.5h2v8h-2z" id="plus-2--plus-segment" />
    </defs>
    <g fill="currentColor">
      <g>
        <circle cx="8.5" cy="8.5" r="49%" opacity=".5" filter="url(#plus-2--a)" />
        <circle
          cx="8.5"
          cy="8.5"
          r="46%"
          stroke="currentColor"
          fill="transparent"
          filter="url(#plus-2--b)"
        />
      </g>
      <g>
        <use xlinkHref="#plus-2--plus-segment" />
        <use xlinkHref="#plus-2--plus-segment" transform="rotate(-90 8.5 8.5)" />
      </g>
    </g>
    <filter id="plus-2--a">
      <feColorMatrix in="SourceGraphic" type="saturate" values="1.1" />
      <feComponentTransfer>
        <feFuncR type="gamma" exponent=".2" />
        <feFuncG type="gamma" exponent=".2" />
        <feFuncB type="gamma" exponent=".2" />
      </feComponentTransfer>
    </filter>
    <filter id="plus-2--b">
      <feColorMatrix in="SourceGraphic" type="saturate" values="1.05" />
      <feComponentTransfer>
        <feFuncR type="gamma" exponent=".8" />
        <feFuncG type="gamma" exponent=".8" />
        <feFuncB type="gamma" exponent=".8" />
      </feComponentTransfer>
    </filter>
  </svg>
);
