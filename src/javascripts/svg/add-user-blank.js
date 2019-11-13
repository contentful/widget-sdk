import React from 'react';
import PropTypes from 'prop-types';

const AddUserBlank = ({ className }) => {
  return (
    <svg
      className={className}
      data-name="Layer 1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 206.44 158.21">
      <defs>
        <clipPath id="a" transform="translate(-31.65 -11.47)">
          <circle
            cx="158.99"
            cy="90.58"
            r="77.11"
            stroke="#dbecfe"
            strokeMiterlimit="10"
            strokeWidth="4"
            fill="#fff"
          />
        </clipPath>
      </defs>
      <path
        d="M30.28 75H21v-9.28a3.9 3.9 0 0 0-3.91-3.9 3.9 3.9 0 0 0-3.9 3.9V75H3.91A3.91 3.91 0 0 0 0 78.91a3.91 3.91 0 0 0 3.91 3.9h9.28v9.28a3.91 3.91 0 0 0 3.9 3.91A3.91 3.91 0 0 0 21 92.09v-9.28h9.28a3.91 3.91 0 0 0 3.9-3.9 3.91 3.91 0 0 0-3.9-3.91z"
        fill="#00de91"
      />
      <circle cx="127.33" cy="79.11" r="77.11" fill="#fff" />
      <g clipPath="url(#a)">
        <path
          d="M149.09 111.95h-43.51a10.32 10.32 0 0 1-10.31-10.32V60.88a32.07 32.07 0 0 1 32.08-32.07 32.07 32.07 0 0 1 32.07 32.07v40.75a10.32 10.32 0 0 1-10.33 10.32z"
          fill="#0058b0"
        />
        <path
          d="M153.88 152.39l-26.5 4.6-26.92-5-15.45-8.14c-2.41-26.86 16.63-37.51 38.82-37.51h7c22.18 0 37.43 17.2 37.43 39.39z"
          fill="#ffd840"
        />
        <path
          d="M117.6 94.92h19.47v16.29a8 8 0 0 1-8 8h-3.38a8 8 0 0 1-8-8V94.92z"
          fill="#94c5fa"
        />
      </g>
      <circle
        cx="127.33"
        cy="79.11"
        r="77.11"
        fill="none"
        stroke="#dbecfe"
        strokeMiterlimit="10"
        strokeWidth="4"
      />
      <path
        d="M146.03 65.45h-14.5l-2.58-9.83-3.6 9.83h-16.71a4.49 4.49 0 0 0-4.48 4.48v9.09a23.17 23.17 0 0 0 23.19 23.17 23.17 23.17 0 0 0 23.17-23.17v-9.09a4.48 4.48 0 0 0-4.49-4.48z"
        fill="#dbecfe"
      />
    </svg>
  );
};

AddUserBlank.propTypes = { className: PropTypes.string };

export default AddUserBlank;
