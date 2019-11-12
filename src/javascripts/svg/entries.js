import React from 'react';

export default () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="19"
    viewBox="-1 -1 17 21"
    xmlnsXlink="http://www.w3.org/1999/xlink">
    <defs>
      <rect width="13" height="16" x="2" y="2.375" rx="2" id="entries--a" />
      <mask width="13" height="16" x="0" y="0" fill="#fff" id="entries--d">
        <use xlinkHref="#entries--a" />
      </mask>
      <rect width="13" height="16" y=".375" rx="2" id="entries--b" />
      <mask width="13" height="16" x="0" y="0" fill="#fff" id="entries--e">
        <use xlinkHref="#entries--b" />
      </mask>
      <mask id="entries--c">
        <rect width="100%" height="100%" fill="#fff" />
        <use xlinkHref="#entries--b" />
      </mask>
    </defs>
    <g fill="none" fillRule="evenodd" stroke="currentColor">
      <use strokeWidth="2" mask="url(#entries--b)" xlinkHref="#rect" />
      <g mask="url(#entries--c)">
        <use
          fill="currentColor"
          fillOpacity=".1"
          strokeWidth="2"
          mask="url(#entries--d)"
          xlinkHref="#entries--a"
        />
      </g>
      <use strokeWidth="2" mask="url(#entries--e)" xlinkHref="#entries--b" />
      <g strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.516 4.5H9.35m-5.833 2H9.35m-5.833 2H9.35m-5.833 2H9.35m-5.833 2H5.85" />
      </g>
    </g>
  </svg>
);
