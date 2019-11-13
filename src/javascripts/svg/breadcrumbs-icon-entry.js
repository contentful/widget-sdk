import React from 'react';

export default () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="-1 -1 18 18"
    xmlnsXlink="http://www.w3.org/1999/xlink">
    <defs>
      <rect width="16" height="16" rx="2" id="breadcrumbs-icon-entry--a" />
      <mask width="16" height="16" x="0" y="0" fill="#fff" id="breadcrumbs-icon-entry--b">
        <use xlinkHref="#breadcrumbs-icon-entry--a" />
      </mask>
    </defs>
    <g fill="none" fillRule="evenodd" stroke="#A9B9C0">
      <use
        strokeWidth="2"
        mask="url(#breadcrumbs-icon-entry--b)"
        xlinkHref="#breadcrumbs-icon-entry--a"
      />
      <path
        d="M3.7 4.2h8.6M3.7 6.9h8.6M3.7 9.6h8.6m-8.6 2.5h6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);
