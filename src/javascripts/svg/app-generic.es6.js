import React from 'react';

const AppGenericIcon = props => (
  <svg width={60} height={60} viewBox="0 0 60 60" {...props}>
    <g fill="none" fillRule="evenodd">
      <rect fill="#FFF" width={60} height={60} rx={3} />
      <path d="M0 0h60v60H0z" />
      <path
        d="M51.25 27.5H47.5v-10c0-2.75-2.25-5-5-5h-10V8.75c0-3.45-2.8-6.25-6.25-6.25S20 5.3 20 8.75v3.75H10c-2.75 0-4.975 2.25-4.975 5V27H8.75a6.754 6.754 0 0 1 6.75 6.75 6.754 6.754 0 0 1-6.75 6.75H5V50c0 2.75 2.25 5 5 5h9.5v-3.75a6.754 6.754 0 0 1 6.75-6.75A6.754 6.754 0 0 1 33 51.25V55h9.5c2.75 0 5-2.25 5-5V40h3.75c3.45 0 6.25-2.8 6.25-6.25s-2.8-6.25-6.25-6.25z"
        fill="#8091A5"
        fillRule="nonzero"
      />
    </g>
  </svg>
);

export default AppGenericIcon;
