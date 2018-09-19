import React from 'react';

export default () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="-1 -1 20 20"
    xmlnsXlink="http://www.w3.org/1999/xlink">
    <defs>
      <path
        d="M2 4.567v-.57A2 2 0 0 1 4.004 2H15.99C17.1 2 18 2.895 18 3.994v12.012C18 17.107 17.1 18 16.006 18h-.356"
        id="breadcrumbs-icon-entries--a"
      />
      <mask width="16" height="16" x="0" y="0" fill="#fff" id="breadcrumbs-icon-entries--c">
        <use xlinkHref="#breadcrumbs-icon-entries--a" />
      </mask>
      <rect width="16" height="16" rx="2" id="breadcrumbs-icon-entries--b" />
      <mask width="16" height="16" x="0" y="0" fill="#fff" id="breadcrumbs-icon-entries--d">
        <use xlinkHref="#breadcrumbs-icon-entries--b" />
      </mask>
    </defs>
    <g fill="none" fillRule="evenodd" stroke="#A9B9C0">
      <use
        strokeWidth="2"
        mask="url(#breadcrumbs-icon-entries--c)"
        transform="rotate(90 10 10)"
        xlinkHref="#breadcrumbs-icon-entries--a"
      />
      <use
        strokeWidth="2"
        mask="url(#breadcrumbs-icon-entries--d)"
        xlinkHref="#breadcrumbs-icon-entries--b"
      />
      <path
        d="M3.7 4.2h8.6M3.7 6.9h8.6M3.7 9.6h8.6m-8.6 2.5h6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);
