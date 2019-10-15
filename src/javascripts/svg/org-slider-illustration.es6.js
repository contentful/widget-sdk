import React from 'react';

export default () => (
  <svg
    width="243px"
    height="183px"
    viewBox="0 0 243 183"
    version="1.1"
    xmlnsXlink="http://www.w3.org/1999/xlink">
    <defs>
      <polygon id="a" points="5.25 7.5 9 11.25 12.75 7.5" />
      <path
        d="M15 4.5H9L7.5 3H3c-.825 0-1.492.675-1.492 1.5l-.008 9c0 .825.675 1.5 1.5 1.5h12c.825 0 1.5-.675 1.5-1.5V6c0-.825-.675-1.5-1.5-1.5zm0 9H3V6h12v7.5z"
        id="c"
      />
      <path
        d="M15 4.5H9L7.5 3H3c-.825 0-1.492.675-1.492 1.5l-.008 9c0 .825.675 1.5 1.5 1.5h12c.825 0 1.5-.675 1.5-1.5V6c0-.825-.675-1.5-1.5-1.5zm0 9H3V6h12v7.5z"
        id="e"
      />
    </defs>
    <g stroke="none" strokeWidth={1} fill="none" fillRule="evenodd">
      <path d="M1.5.5v182h239V.5H1.5z" stroke="#E5EBED" fill="#F7F9FA" fillRule="nonzero" />
      <rect fill="#E5EBED" fillRule="nonzero" x={1} y={0} width={240} height={45} />
      <text fontSize={13} fontWeight={400} fill="#536171">
        <tspan x={59} y={27}>
          Organization
        </tspan>
      </text>
      <circle fill="#FFF" fillRule="nonzero" cx="31.5" cy="22.5" r="14.5" />
      <text fontSize={13} fontWeight={400} fill="#536171">
        <tspan x={15} y={75}>
          Spaces
        </tspan>
      </text>
      <g transform="translate(214.000000, 14.000000)">
        <mask id="b" fill="#fff">
          <use xlinkHref="#a" />
        </mask>
        <use fill="#000" fillRule="nonzero" xlinkHref="#a" />
        <g strokeWidth={1} fillRule="evenodd" mask="url(#b)" fill="#536171">
          <rect x={0} y={0} width={18} height={18} />
        </g>
      </g>
      <g transform="translate(15.000000, 108.000000)">
        <mask id="d" fill="#fff">
          <use xlinkHref="#c" />
        </mask>
        <use fill="#000" fillRule="nonzero" xlinkHref="#c" />
        <g strokeWidth={1} fillRule="evenodd" mask="url(#d)" fill="#C3CFD5">
          <rect x={0} y={0} width={18} height={18} />
        </g>
      </g>
      <g transform="translate(15.000000, 149.500000)">
        <mask id="f" fill="#fff">
          <use xlinkHref="#e" />
        </mask>
        <use fill="#000" fillRule="nonzero" xlinkHref="#e" />
        <g strokeWidth={1} fillRule="evenodd" mask="url(#f)" fill="#C3CFD5">
          <rect x={0} y={0} width={18} height={18} />
        </g>
      </g>
      <path d="M242 88.5H1" stroke="#E5EBED" strokeLinecap="square" />
      <rect fill="#E5EBED" fillRule="nonzero" x={44} y={111} width={98} height={14} />
      <rect fill="#E5EBED" fillRule="nonzero" x={44} y={152} width={98} height={14} />
    </g>
  </svg>
);