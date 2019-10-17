const search = h =>
  h(
    'svg',
    {
      width: '12',
      height: '12',
      viewBox: '0 0 12 12',
      xmlns: 'http://www.w3.org/2000/svg'
    },
    [
      h('path', {
        d:
          'M8.576 7.547h-.542l-.192-.185A4.44 4.44 0 0 0 8.92 4.46a4.46 4.46 0 1 0-4.46 4.46 4.44 4.44 0 0 0 2.903-1.078l.185.192v.542L10.977 12 12 10.978l-3.424-3.43zm-4.116 0A3.083 3.083 0 0 1 1.372 4.46 3.083 3.083 0 0 1 4.46 1.372 3.083 3.083 0 0 1 7.547 4.46 3.083 3.083 0 0 1 4.46 7.547z',
        fillRule: 'nonzero',
        stroke: 'none'
      })
    ]
  );

const info = h =>
  h(
    'svg',
    {
      width: '21',
      height: '21',
      viewBox: '0 0 21 21',
      xmlns: 'http://www.w3.org/2000/svg'
    },
    [
      h(
        'g',
        {
          fill: 'none',
          fillRule: 'evenodd'
        },
        [
          h('path', {
            d: 'M1 0h20v20H1z'
          }),
          h(
            'g.icon-svg-info-stroke',
            {
              transform: 'translate(1 .833)',
              stroke: '#FFF',
              strokeLinejoin: 'round'
            },
            [
              h('circle', {
                strokeLinecap: 'round',
                cx: '9.583',
                cy: '9.583',
                r: '9.167'
              }),
              h('path', {
                strokeLinecap: 'round',
                d: 'M7.917 7.917h1.666V15'
              }),
              h('path', {
                d: 'M9.167 4.167a.417.417 0 1 0 0 .833.417.417 0 0 0 0-.833z'
              })
            ]
          )
        ]
      )
    ]
  );

const pageSettings = h =>
  h(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '36',
      height: '36',
      viewBox: '0 0 48 48'
    },
    [
      h('path', {
        d:
          'M47 20h-5.7c-.4-1.6-.9-3.3-1.6-4.7l4.1-4.1c.2-.2.3-.4.3-.7 0-.3-.1-.5-.3-.7l-5.7-5.7c-.4-.4-1-.4-1.4 0l-4.1 4.1c-1.3-.6-3.1-1.2-4.7-1.6V1c0-.5-.5-1-1-1h-6c-.5 0-1 .5-1 1v5.7c-1.6.4-3.3.9-4.7 1.6l-4.1-4.1c-.4-.4-1-.4-1.4 0L4.2 9.9c-.2.1-.3.4-.3.7 0 .3.1.5.3.7l4.1 4.1c-.7 1.3-1.2 3.1-1.6 4.7H1c-.5 0-1 .5-1 1v6c0 .5.5 1 1 1h5.7c.4 1.6.9 3.3 1.6 4.7l-4.1 4.1c-.2.2-.3.4-.3.7 0 .3.1.5.3.7L9.9 44c.4.4 1 .4 1.4 0l4.1-4.1c1.3.7 3.1 1.2 4.7 1.6V47c0 .5.5 1 1 1h6c.5 0 1-.5 1-1v-5.7c1.6-.4 3.3-.9 4.7-1.6l4.1 4.1c.4.4 1 .4 1.4 0l5.7-5.7c.4-.4.4-1 0-1.4l-4.1-4.1c.7-1.3 1.2-3.1 1.6-4.7H47c.5 0 1-.5 1-1v-6c0-.4-.5-.9-1-.9zm-1 6h-5.5c-.5 0-.9.3-1 .8-.3 1.1-1 4.1-1.9 5.6-.2.4-.2.9.1 1.2l3.9 3.9-4.2 4.2-3.9-3.9c-.3-.3-.8-.4-1.2-.1-1.5.9-4.4 1.6-5.6 1.9-.4.1-.8.5-.8 1V46h-4v-5.5c0-.5-.3-.9-.8-1-1.1-.3-4.1-1-5.6-1.9-.4-.2-.9-.2-1.2.1l-3.9 3.9-4.2-4.2 3.9-3.9c.3-.3.4-.8.1-1.2-.9-1.5-1.6-4.4-1.9-5.6.1-.4-.3-.7-.8-.7H2v-4h5.5c.5 0 .9-.3 1-.8.3-1.1 1-4.1 1.9-5.6.2-.4.2-.9-.1-1.2l-3.9-3.9 4.2-4.2 3.9 3.9c.3.3.8.4 1.2.1 1.5-.9 4.4-1.6 5.5-1.9.5 0 .8-.4.8-.9V2h4v5.5c0 .5.3.9.8 1 1.1.3 4.1 1 5.5 1.9.4.2.9.2 1.2-.1l3.9-3.9 4.2 4.2-3.9 3.9c-.3.3-.4.8-.1 1.2.9 1.5 1.6 4.4 1.9 5.5.1.5.5.8 1 .8H46v4z',
        fill: '#0eb87f'
      }),
      h('path', {
        d:
          'M39.5 26.8c.1-.4.5-.8 1-.8H46v-4h-5.5c-.5 0-.9-.3-1-.8-.3-1.1-1-4.1-1.9-5.5-.2-.4-.2-.9.1-1.2l3.9-3.9-4.2-4.2-3.9 3.9c-.3.3-.8.4-1.2.1-1.5-.9-4.4-1.6-5.5-1.9-.5-.1-.8-.5-.8-1V2h-4v5.5c0 .5-.3.9-.8 1-1.1.3-4.1 1-5.5 1.9-.4.2-.9.2-1.2-.1l-3.9-3.9-4.2 4.2 3.9 3.9c.3.3.4.8.1 1.2-.9 1.5-1.6 4.4-1.9 5.6-.1.4-.5.7-1 .7H2v4h5.5c.5 0 .9.3 1 .8.3 1.1 1 4.1 1.9 5.6.2.4.2.9-.1 1.2l-3.9 3.9 4.2 4.2 3.9-3.9c.3-.3.8-.4 1.2-.1 1.5.9 4.4 1.6 5.6 1.9.4.1.8.5.8 1V46h4v-5.5c0-.5.3-.9.8-1 1.1-.3 4.1-1 5.6-1.9.4-.2.9-.2 1.2.1l3.9 3.9 4.2-4.2-3.9-3.9c-.3-.3-.4-.8-.1-1.2.7-1.5 1.5-4.4 1.7-5.5zM24 34c-5.5 0-10-4.5-10-10s4.5-10 10-10 10 4.5 10 10-4.5 10-10 10z',
        fill: '#c0f2d6'
      }),
      h('path', {
        d:
          'M24 14c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z',
        fill: '#0eb87f'
      })
    ]
  );

export default function makeIcons(h) {
  return {
    search: search(h),
    info: info(h),
    pageSettings: pageSettings(h)
  };
}
