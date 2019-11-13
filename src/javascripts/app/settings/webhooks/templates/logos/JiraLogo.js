import React from 'react';

const JiraLogo = props => (
  <svg width={32} height={32} {...props}>
    <defs>
      <linearGradient x1="91.867%" y1="40.328%" x2="28.264%" y2="81.66%" id="a">
        <stop stopColor="#0052CC" offset="18%" />
        <stop stopColor="#2684FF" offset="100%" />
      </linearGradient>
      <linearGradient x1="8.71%" y1="59.166%" x2="72.243%" y2="17.99%" id="b">
        <stop stopColor="#0052CC" offset="18%" />
        <stop stopColor="#2684FF" offset="100%" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path
        d="M30.33 15.057L16.673 1.33 15.349 0 5.07 10.333l-4.7 4.724a1.268 1.268 0 0 0 0 1.785l9.392 9.44 5.588 5.617 10.28-10.333.16-.16 4.54-4.564c.49-.493.49-1.292 0-1.785zm-14.98 5.608l-4.693-4.716 4.692-4.715 4.692 4.715-4.692 4.716z"
        fill="#2684FF"
        fillRule="nonzero"
      />
      <path
        d="M16.35 11.234c-3.073-3.088-3.088-8.09-.034-11.196L6.048 10.354l5.588 5.617 4.713-4.737z"
        fill="url(#a)"
        fillRule="nonzero"
        transform="translate(-1)"
      />
      <path
        d="M21.054 15.937l-4.705 4.728a7.962 7.962 0 0 1 2.316 5.617 7.962 7.962 0 0 1-2.316 5.617l10.293-10.345-5.588-5.617z"
        fill="url(#b)"
        fillRule="nonzero"
        transform="translate(-1)"
      />
      <path d="M-1 0h32v32H-1z" />
    </g>
  </svg>
);

export default JiraLogo;
