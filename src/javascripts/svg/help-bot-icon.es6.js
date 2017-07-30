import {h} from 'ui/Framework';

export default h("svg", {
  width: "24",
  height: "24",
  viewBox: "0 0 24 24",
  xmlns: "http://www.w3.org/2000/svg"
}, [
  h("defs", [
    h("linearGradient#a", {
      x1: "50%",
      y1: "0%",
      x2: "50%",
      y2: "98.643%",
      id: "a"
    }, [
      h("stop", {
        stopColor: "#A9B9C0",
        offset: "0%"
      }),
      h("stop", {
        stopColor: "#8091A5",
        offset: "100%"
      })
    ])
  ]),
  h("g", {
    fill: "none",
    fillRule: "evenodd"
  }, [
    h("path", {
      d: "M10.136 20.844c.096.003.192.004.288.004h3.152C19.333 20.848 24 16.181 24 10.424S19.333 0 13.576 0h-3.152C4.667 0 0 4.667 0 10.424c0 3.767 1.998 7.068 4.993 8.9v3.4a.714.714 0 0 0 1.088.609l4.055-2.489z",
      fill: "url(#a)"
    }),
    h("text", {
      fontSize: "16",
      fill: "#F7F9FA"
    }, [
      h("tspan", {
        x: "8",
        y: "16"
      }, ["?"])
    ])
  ])
])
