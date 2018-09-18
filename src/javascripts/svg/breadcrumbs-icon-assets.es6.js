import React from 'react';

export default () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="-1 -1 20 20"
    xmlnsXlink="http://www.w3.org/1999/xlink">
    <defs>
      <rect width="16" height="15.59" y=".2" rx="2" id="breadcrumbs-icon-assets--a" />
      <mask width="16" height="15.59" x="0" y="0" fill="#fff" id="breadcrumbs-icon-asset--c">
        <use xlinkHref="#breadcrumbs-icon-asset--a" />
      </mask>
      <path
        d="M2 4.567v-.57A2 2 0 0 1 4.004 2H15.99C17.1 2 18 2.895 18 3.994v12.012C18 17.107 17.1 18 16.006 18h-.356"
        id="breadcrumbs-icon-asset--b"
      />
      <mask width="16" height="16" x="0" y="0" fill="#fff" id="breadcrumbs-icon-asset--d">
        <use xlinkHref="#breadcrumbs-icon-asset--b" />
      </mask>
    </defs>
    <g fill="none" fillRule="evenodd" stroke="#A9B9C0">
      <use
        fill="#FFF"
        fillOpacity="0"
        strokeWidth="2"
        mask="url(#breadcrumbs-icon-asset--c)"
        xlinkHref="#breadcrumbs-icon-asset--a"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M.5 9.574l5.001-4.001 7.015 9.714M9.501 10.074l2-2 3.837 3.635"
      />
      <ellipse cx="10.251" cy="4.323" rx="1.25" ry="1.25" />
      <use
        strokeWidth="2"
        mask="url(#breadcrumbs-icon-asset--d)"
        transform="rotate(90 10 10)"
        xlinkHref="#breadcrumbs-icon-asset--b"
      />
    </g>
  </svg>
);
