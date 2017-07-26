import {h} from 'ui/Framework';

export default h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '-1 -1 65 42',
  height: '40',
  width: '63'
}, [
  h('g', {
    fill: 'none',
    fillRule: 'evenodd'
  }, [
    h('g', [
      h('g', [
        h('g', {
          fill: '#a3a9b2'
        }, [
          h('path', {
            d: 'M11.463 1.764h2.32q.44 0 .892.1.45.087.803.318.363.22.583.605.23.385.23.968 0 .616-.373 1.078-.374.451-1.001.594v.022q.759.088 1.254.594.506.495.506 1.353 0 .484-.21.891-.197.396-.571.682-.374.275-.913.43-.54.153-1.21.153h-2.31V1.764zm.792 3.41h1.595q.286 0 .572-.066.297-.066.539-.22.242-.165.385-.429.154-.264.154-.649 0-.374-.154-.627-.143-.264-.396-.429-.253-.165-.594-.23-.341-.078-.726-.078h-1.375v2.728zm0 3.696h1.474q.429 0 .814-.077.396-.088.682-.264.297-.187.473-.473.176-.297.176-.704 0-.77-.528-1.144-.517-.385-1.474-.385h-1.617V8.87zM18.422 5.537q0-.209-.01-.539-.012-.33-.034-.594h.715q.022.21.033.462.011.253.011.418h.022q.22-.45.66-.726.44-.286.99-.286.143 0 .253.011.121.011.242.044l-.099.704q-.066-.022-.22-.044t-.308-.022q-.297 0-.572.11-.275.11-.484.352-.198.231-.33.605-.12.363-.12.88v2.64h-.749V5.537zM26.11 6.582q-.034-.726-.474-1.199-.429-.484-1.232-.484-.374 0-.693.143-.319.132-.56.374-.243.231-.386.54-.143.296-.165.626h3.51zm.758.242v.165q0 .088-.01.187h-4.269q.011.385.154.726.143.341.396.594.253.253.594.407.341.143.737.143.583 0 1.001-.264.43-.275.65-.627l.56.44q-.462.583-1.023.836-.55.253-1.188.253-.572 0-1.067-.198-.484-.209-.836-.572t-.56-.858q-.199-.495-.199-1.078 0-.583.198-1.078.198-.495.55-.858.352-.363.825-.56.473-.21 1.023-.21.605 0 1.067.21.462.197.77.55.308.34.462.802.165.462.165.99zM31.658 6.23q0-.67-.352-1-.352-.33-1.023-.33-.462 0-.858.164-.396.165-.671.44l-.418-.495q.319-.319.836-.528.528-.209 1.188-.209.418 0 .78.121.364.11.639.341.275.231.429.583.154.352.154.825v2.255q0 .297.022.616.022.32.066.54h-.671q-.033-.188-.055-.408-.022-.22-.022-.429h-.022q-.352.517-.803.748-.44.22-1.067.22-.297 0-.616-.088-.308-.077-.572-.264-.253-.187-.43-.484-.164-.297-.164-.726 0-.594.297-.935.308-.352.814-.517.506-.176 1.155-.22.66-.055 1.364-.055V6.23zm-.22.748q-.462 0-.935.044-.462.033-.847.154-.374.11-.616.33-.242.22-.242.583 0 .275.099.462.11.187.286.308.176.11.385.165.22.044.44.044.396 0 .704-.132.308-.143.517-.374.209-.242.319-.55.11-.308.11-.649v-.385h-.22zM35.048 6.725h.033l2.376-2.32h1.078l-2.596 2.353 2.86 2.794h-1.1L35.08 6.846h-.033v2.706H34.3V1.236h.748v5.49zM42.063 5.031h-1.21v4.521h-.748v-4.52h-1.078v-.628h1.078V2.996q0-.88.43-1.386.428-.506 1.32-.506.142 0 .307.022.165.011.308.055l-.132.66q-.12-.033-.242-.055-.12-.022-.275-.022-.297 0-.495.1-.187.098-.297.285-.099.176-.143.418-.033.242-.033.517v1.32h1.21v.627zM46.374 6.23q0-.67-.352-1Q45.67 4.9 45 4.9q-.462 0-.858.164-.396.165-.67.44l-.419-.495q.32-.319.836-.528.528-.209 1.188-.209.418 0 .781.121.363.11.638.341.275.231.43.583.153.352.153.825v2.255q0 .297.022.616.022.32.066.54h-.67q-.034-.188-.056-.408-.022-.22-.022-.429h-.022q-.352.517-.803.748-.44.22-1.067.22-.297 0-.616-.088-.308-.077-.572-.264-.253-.187-.429-.484-.165-.297-.165-.726 0-.594.297-.935.308-.352.814-.517.506-.176 1.155-.22.66-.055 1.364-.055V6.23zm-.22.748q-.462 0-.935.044-.462.033-.847.154-.374.11-.616.33-.242.22-.242.583 0 .275.1.462.11.187.285.308.176.11.385.165.22.044.44.044.396 0 .704-.132.308-.143.517-.374.21-.242.32-.55.11-.308.11-.649v-.385h-.22zM51.734 5.625q-.165-.319-.506-.517-.33-.209-.76-.209-.197 0-.395.044t-.352.143q-.154.1-.253.253-.088.154-.088.363 0 .363.297.561.297.187.935.32.913.186 1.342.55.44.351.44.956 0 .44-.176.748-.165.297-.44.495-.275.187-.627.264-.341.088-.693.088-.583 0-1.133-.242t-.902-.759l.594-.44q.198.341.583.572.385.231.847.231.242 0 .462-.044.22-.044.385-.154t.264-.275q.099-.176.099-.429 0-.407-.396-.605-.385-.209-1.122-.385-.231-.055-.495-.132-.253-.088-.473-.242-.22-.165-.363-.407-.143-.242-.143-.605 0-.396.154-.67.154-.287.407-.463.264-.187.594-.275.33-.088.682-.088.539 0 1.045.242.506.242.759.682l-.572.43zM56.193 5.031H54.74v3.003q0 .286.055.473t.154.297q.11.1.253.143.143.033.308.033.154 0 .319-.044.176-.044.33-.12l.033.648q-.198.077-.418.11-.21.044-.462.044-.21 0-.44-.055-.231-.055-.43-.209-.197-.154-.33-.418-.12-.264-.12-.693V5.031h-1.067v-.627h1.067V2.952h.748v1.452h1.452v.627zM12.255 23.848h3.63v.704h-4.422v-7.788h.792v7.084zM20.637 24.552q-.022-.209-.033-.462-.01-.253-.01-.418h-.023q-.22.451-.715.737-.495.275-1.045.275-.979 0-1.474-.583-.484-.583-.484-1.54v-3.157h.748v2.85q0 .406.066.736.066.33.22.572.165.231.43.363.274.132.681.132.297 0 .572-.12.286-.122.506-.364.22-.253.352-.627.132-.385.132-.902v-2.64h.748v4.015q0 .21.011.54.011.33.033.593h-.715zM23.949 19.404q.022.21.033.462.01.253.01.418h.023q.22-.45.715-.726.495-.286 1.045-.286.979 0 1.463.583.495.583.495 1.54v3.157h-.748v-2.849q0-.407-.066-.737t-.231-.56q-.154-.243-.43-.375-.263-.132-.67-.132-.297 0-.583.121-.275.121-.495.374-.22.242-.352.627-.132.374-.132.891v2.64h-.748v-4.015q0-.209-.011-.539-.011-.33-.033-.594h.715zM33.366 20.581q-.187-.297-.55-.484-.352-.198-.77-.198-.451 0-.814.165-.363.154-.627.44-.253.275-.396.66-.132.374-.132.814 0 .44.132.814.143.374.396.66.253.275.616.44.363.154.814.154.495 0 .836-.187.34-.187.56-.484l.562.418q-.33.407-.814.65-.473.241-1.144.241-.627 0-1.133-.198-.506-.209-.87-.572-.351-.363-.55-.858-.197-.495-.197-1.078 0-.583.198-1.078.198-.495.55-.858.363-.363.869-.56.506-.21 1.133-.21.517 0 1.045.231.539.22.869.66l-.583.418zM35.95 20.251q.21-.45.694-.715.484-.264 1.034-.264.979 0 1.463.583.495.583.495 1.54v3.157h-.748v-2.849q0-.407-.066-.737t-.231-.56q-.154-.243-.43-.375-.263-.132-.67-.132-.297 0-.583.121-.275.121-.495.374-.22.242-.352.627-.132.374-.132.891v2.64h-.748v-8.316h.748v4.015h.022zM11.463 31.764h2.585q.726 0 1.452.242.737.242 1.32.737.594.484.957 1.221.363.726.363 1.694 0 .98-.363 1.705-.363.726-.957 1.221-.583.484-1.32.726-.726.242-1.452.242h-2.585v-7.788zm.792 7.084h1.573q.88 0 1.529-.275.66-.275 1.089-.715.429-.45.638-1.023.22-.572.22-1.177 0-.605-.22-1.177-.21-.572-.638-1.012-.43-.45-1.09-.726-.648-.275-1.528-.275h-1.573v6.38zM20.513 39.552h-.748v-5.148h.748v5.148zm.154-7.128q0 .231-.165.385-.165.143-.363.143-.198 0-.363-.143-.165-.154-.165-.385 0-.23.165-.374.165-.154.363-.154.198 0 .363.154.165.143.165.374zM23.175 34.404q.022.21.033.462.011.253.011.418h.022q.22-.45.715-.726.495-.286 1.045-.286.98 0 1.463.583.495.583.495 1.54v3.157h-.748v-2.849q0-.407-.066-.737t-.23-.56q-.155-.243-.43-.375-.264-.132-.67-.132-.298 0-.584.121-.275.121-.495.374-.22.242-.352.627-.132.374-.132.891v2.64h-.748v-4.015q0-.209-.01-.539-.012-.33-.034-.594h.715zM29.556 34.404q.022.21.033.462.011.253.011.418h.022q.22-.45.715-.726.495-.286 1.045-.286.98 0 1.463.583.495.583.495 1.54v3.157h-.748v-2.849q0-.407-.066-.737t-.23-.56q-.155-.243-.43-.375-.264-.132-.67-.132-.298 0-.584.121-.275.121-.495.374-.22.242-.352.627-.132.374-.132.891v2.64h-.748v-4.015q0-.209-.01-.539-.012-.33-.034-.594h.715zM39.193 36.582q-.033-.726-.473-1.199-.429-.484-1.232-.484-.374 0-.693.143-.319.132-.56.374-.243.231-.386.54-.143.296-.165.626h3.51zm.76.242v.165q0 .088-.012.187h-4.268q.011.385.154.726.143.341.396.594.253.253.594.407.341.143.737.143.583 0 1.001-.264.43-.275.65-.627l.56.44q-.462.583-1.023.836-.55.253-1.188.253-.572 0-1.067-.198-.484-.209-.836-.572t-.56-.858q-.199-.495-.199-1.078 0-.583.198-1.078.198-.495.55-.858.352-.363.825-.56.473-.21 1.023-.21.605 0 1.067.21.462.197.77.55.308.34.462.802.165.462.165.99zM41.561 35.537q0-.209-.01-.539-.012-.33-.034-.594h.715q.022.21.033.462.011.253.011.418h.022q.22-.45.66-.726.44-.286.99-.286.143 0 .253.011.121.011.242.044l-.099.704q-.066-.022-.22-.044t-.308-.022q-.297 0-.572.11-.275.11-.484.352-.198.231-.33.605-.12.363-.12.88v2.64h-.749v-4.015z'
          })
        ]),
        h('g', {
          transform: 'translate(.5 3.5)',
          stroke: '#b7c2cc'
        }, [
          h('rect', {
            width: '7',
            height: '7',
            rx: '2',
            fill: '#fff'
          }),
          h('path', {
            d: 'M4.81 2.771L3.238 4.344l-.852-.852',
            strokeLinecap: 'square'
          })
        ]),
        h('g', {
          transform: 'translate(.5 17.5)',
          stroke: '#b7c2cc'
        }, [
          h('rect', {
            width: '7',
            height: '7',
            rx: '2',
            fill: '#fff'
          }),
          h('path', {
            d: 'M4.81 2.771L3.238 4.344l-.852-.852',
            strokeLinecap: 'square'
          })
        ]),
        h('g', {
          transform: 'translate(.5 32.5)',
          fill: '#fff',
          stroke: '#b7c2cc'
        }, [
          h('rect', {
            width: '7',
            height: '7',
            rx: '2'
          })
        ])
      ])
    ])
  ])
]);
