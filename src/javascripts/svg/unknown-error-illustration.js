import React from 'react';
import PropTypes from 'prop-types';

const UnknownErrorIllustration = ({ className }) => {
  return (
    <svg className={className} viewBox="0 0 295 202.81" xmlns="http://www.w3.org/2000/svg">
      <title>Unknown error illustration</title>
      <linearGradient
        id="a"
        gradientTransform="matrix(-1 0 0 1 299.55 0)"
        gradientUnits="userSpaceOnUse"
        x1="8.04"
        x2="298.32"
        y1="101.84"
        y2="101.84">
        <stop offset="0" stopColor="#f3fafd" />
        <stop offset=".99" stopColor="#cfedf9" />
      </linearGradient>
      <clipPath id="b">
        <path d="m291.16 111.52a43.2 43.2 0 0 0 -43.16-43.2c-.84 0-1.67 0-2.5.08-51 .93-97.24-41.45-97.24-41.45a86.38 86.38 0 1 0 -66.96 147.42c7.08 1.34 22.19 4.83 34.65 12.12a64.75 64.75 0 0 0 94.05-12.32c6-6.13 18.49-16.15 38.93-19.48a43.18 43.18 0 0 0 42.23-43.17z" />
      </clipPath>
      <path
        d="m291.51 111.78a43.2 43.2 0 0 0 -43.2-43.2c-.84 0-1.67 0-2.5.08-51 .93-97.24-41.45-97.24-41.45a86.39 86.39 0 1 0 -66.93 147.43c7.08 1.33 22.2 4.82 34.66 12.11a64.74 64.74 0 0 0 94-12.32c6-6.13 18.49-16.15 38.93-19.48a43.19 43.19 0 0 0 42.28-43.17z"
        fill="url(#a)"
      />
      <path
        d="m156.93 145.54-51.37 16.52-6.56-51.38a1.46 1.46 0 0 1 1-1.5l55.06-46.58c.6-.2 15 35.2 15.91 35.7l-13.09 45.75a1.44 1.44 0 0 1 -.95 1.49z"
        fill="#94c5fa"
      />
      <path
        d="m204.57 31.58 48.43 9.35c3.42.67 4 5.47.82 7.34l-41.31 25.39a3.59 3.59 0 0 1 -5.44-2.29l-7.13-34.73a4.16 4.16 0 0 1 4.63-5.06z"
        fill="#0058b0"
      />
      <path
        d="m185.05 102.29-4.86 5.65c-.18.3-.76-.13-.88-.66l-1.58-9.19c-.08-.38.13-.56.43-.37l6.44 3.56c.4.22.59.77.45 1.01z"
        fill="#0058b0"
      />
      <g clipPath="url(#b)">
        <path
          d="m67.22 287.18-57.79-36.9 89.57-140.28c1.11-1.74 3.39-1.69 3.88.1l4.94 18a.91.91 0 0 0 1.14.65l19.56-5a1.81 1.81 0 0 1 2.32 1.53l3.31 20.16a.93.93 0 0 0 1.32.71l17.3-7.09a.94.94 0 0 1 1.14.28l4 5.43z"
          fill="#ffd840"
        />
        <g fill="none" stroke="#94c5fa" strokeMiterlimit="10" strokeWidth="1.25">
          <path d="m108.15 128.72-65.67 103.21" />
          <path d="m134.63 146.17-66.43 104.33" />
        </g>
      </g>
      <g fill="#0058b0">
        <circle cx="190.6" cy="91.42" r="2.39" />
        <circle cx="153.57" cy="50.77" r="2.63" />
        <circle cx="189.65" cy="120.57" r="2.34" />
        <path d="m155.52 62.25s-3.57 2.55-7.2 5.63c-1 .89-7.42 9.27 2.16 27.1 3.66 6.81 15 22.79 17.14 15.32 1.14-3.94 2-7 3.31-11.51a1 1 0 0 0 0-.68c-3.06-6.89-6.47-14.43-8.22-19.07-5.39-14.29-6.23-15.73-7.15-16.79" />
      </g>
      <path
        d="m172.33 120.99v10.35"
        fill="none"
        stroke="#00de91"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="m194.09 109.47 4.48 5.02"
        fill="none"
        stroke="#00de91"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="m146.24 58.34-10.35.28"
        fill="none"
        stroke="#00de91"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
};

UnknownErrorIllustration.propTypes = {
  className: PropTypes.string
};

export default UnknownErrorIllustration;
