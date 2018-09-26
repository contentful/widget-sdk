import React from 'react';

export default () => (
  <div className="tea-onboarding__screenshot-container">
    <svg
      width="248"
      height="177"
      viewBox="0 0 248 177"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink">
      <title>{`tea-screenshot`}</title>
      <defs>
        <path d="M506 96h240v168.814H506z" id="b" />
        <filter
          x="-2.9%"
          y="-3%"
          width="105.8%"
          height="108.3%"
          filterUnits="objectBoundingBox"
          id="a">
          <feOffset dy="2" in="SourceAlpha" result="shadowOffsetOuter1" />
          <feGaussianBlur stdDeviation="2" in="shadowOffsetOuter1" result="shadowBlurOuter1" />
          <feColorMatrix
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.102912454 0"
            in="shadowBlurOuter1"
          />
        </filter>
      </defs>
      <g transform="translate(-502 -94)" fill="none" fillRule="evenodd">
        <use fill="#000" filter="url(#a)" xlinkHref="#b" />
      </g>
    </svg>
    <div className="tea-onboarding__screenshot-image" />
  </div>
);
