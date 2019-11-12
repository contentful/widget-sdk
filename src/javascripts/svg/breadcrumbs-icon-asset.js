import React from 'react';

export default () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="-1 -1 18 18"
    xmlnsXlink="http://www.w3.org/1999/xlink">
    <defs>
      <rect width="16" height="15.59" y=".2" rx="2" id="breadcrumbs-icon-assets--a" />
      <mask width="16" height="15.59" x="0" y="0" fill="#fff" id="breadcrumbs-icon-assets--b">
        <use xlinkHref="#breadcrumbs-icon-assets--a" />
      </mask>
    </defs>
    <g fill="none" fillOpacity="0" fillRule="evenodd" stroke="#A9B9C0">
      <use
        fill="#FFF"
        strokeWidth="2"
        mask="url(#breadcrumbs-icon-assets--b)"
        xlinkHref="#breadcrumbs-icon-assets--a"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M.5 9.574l5.001-4.001 7.015 9.714M9.501 10.074l2-2 3.837 3.635"
      />
      <ellipse cx="10.251" cy="4.323" rx="1.25" ry="1.25" />
    </g>
  </svg>
);
