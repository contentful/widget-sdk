import React from 'react';
import PropTypes from 'prop-types';

const Illustration = ({ className }) => (
  <svg
    className={className}
    data-name="Layer 1"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 280 224.52">
    <defs>
      <linearGradient id="a" y1="112.26" x2={280} y2="112.26" gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#cfedf9" />
        <stop offset="0.33" stopColor="#d5effa" />
        <stop offset="0.78" stopColor="#e8f6fc" />
        <stop offset={1} stopColor="#f3fafd" />
      </linearGradient>
    </defs>
    <path
      d="M280 102.29a43.35 43.35 0 0 0-57.16-41.08c-31.21 4.37-66.23-27.43-73.15-34.06a86.69 86.69 0 1 0-106.22 134.7l75 50.07a65 65 0 0 0 96.21-22.57c20.62-31 48.74-52.77 48.74-52.77l-.07-.13A43.29 43.29 0 0 0 280 102.29z"
      fill="url(#a)"
    />
    <path
      d="M95.61 169.86l16-105.23 115 26.3-14.9 101.41a5.16 5.16 0 0 1-3.5 3.77 5.15 5.15 0 0 1-6.45-3.46l-24.22-83"
      fill="#0058b0"
    />
    <polygon
      points="185.23 101.61 159.46 76.98 186.09 51.12 208.4 76.98 185.23 101.61"
      fill="#ffd840"
    />
    <polyline points="208.7 193.17 209.31 93.79 93.05 74.54 101.94 171.26" fill="#dbecfe" />
    <path
      d="M92.24 52.33c0-9.17-7.82-15-17-15a17 17 0 0 0-17 16.74c0 9.17 8.83 18.51 18 18.51s16-11.08 16-20.25z"
      fill="#0058b0"
    />
    <polygon points="154.49 53.6 166.15 19.87 130.09 30.25 154.49 53.6" fill="#00de91" />
    <path
      d="M192.76 100l-89.5-11.53-.77-3.47a2.14 2.14 0 0 0-1.79-1.65l-20.31-2.77A1.28 1.28 0 0 0 79 82.07l.56 3.24-6.2-.81 17.64 88L206.68 194z"
      fill="#94c5fa"
    />
    <path d="M204.81 196.25L89 174.38s-34-65.18-36.93-81.3l125.71 16.49z" fill="#3397f5" />
    <path
      d="M111.21 24.94a2 2 0 0 1-2-2V19.6h-3.32a2 2 0 0 1 0-4h3.32v-3.36a2 2 0 0 1 4 0v3.32h3.32a2 2 0 0 1 0 4h-3.32v3.32a2 2 0 0 1-2 2.06zm-5.34-8.51a1.15 1.15 0 0 0 0 2.3h4.19v4.19a1.15 1.15 0 0 0 2.3 0v-4.19h4.19a1.15 1.15 0 1 0 0-2.3h-4.19v-4.19a1.15 1.15 0 1 0-2.3 0v4.19z"
      fill="#0058b0"
    />
  </svg>
);

Illustration.propTypes = { className: PropTypes.string };

export default Illustration;
