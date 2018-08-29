import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    width: '30',
    height: '30',
    viewBox: '-1 -1 32 32',
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
        h('g', [
          h('g', [
            h('rect', {
              stroke: '#21304A',
              fill: 'none',
              width: '30',
              height: '30',
              rx: '5'
            }),
            h('path', {
              d:
                'M10.765 17.37h1.53v1.245h-1.53V21h-1.41v-2.385h-4.89v-1.32L8.98 10.38h1.785v6.99zm-1.41-5.325h-.03l-3.36 5.325h3.39v-5.325zM15.88 20.1c0 .26-.095.49-.285.69-.19.2-.43.3-.72.3a.97.97 0 0 1-.713-.293.935.935 0 0 1-.292-.682c0-.27.095-.502.285-.697a.963.963 0 0 1 .72-.293.976.976 0 0 1 1.005.975zm8.295-8.43h-4.38l-.09 2.79c.2-.07.422-.12.668-.15.245-.03.477-.045.697-.045.51 0 .982.077 1.418.232.435.156.81.378 1.125.668.315.29.562.642.742 1.058.18.415.27.877.27 1.387a3.86 3.86 0 0 1-.285 1.515c-.19.45-.45.832-.78 1.148-.33.315-.72.56-1.17.735-.45.175-.94.262-1.47.262-.83 0-1.53-.192-2.1-.578-.57-.385-1-.902-1.29-1.552l1.32-.525c.17.43.437.775.802 1.035.366.26.788.39 1.268.39.31 0 .6-.055.87-.165a2.113 2.113 0 0 0 1.178-1.185c.115-.28.172-.59.172-.93 0-.4-.067-.747-.203-1.043a2.013 2.013 0 0 0-.547-.727c-.23-.19-.495-.33-.795-.42-.3-.09-.615-.135-.945-.135-.4 0-.81.055-1.23.165-.42.11-.795.25-1.125.42l.15-5.64h5.73v1.29z',
              fill: '#000'
            })
          ])
        ])
      ]
    )
  ]
);
