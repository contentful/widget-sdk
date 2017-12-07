This document outlines the implementation of virtual DOM based UI framework.

The public API of the framework consists of
* the `h()` function to construct virtual DOM trees (or VTrees),
* the `renderString()` function to turn a VTree into an HTML string, and
* the `cfComponentBridge` directive that allows you to render a component into
  the DOM from Angular.

The main idea is that a VTree is represented as pure data. It only contains
information on what to render and not how. That means a VTree is not tied to a
specific rendering library like React.

The [`Hyperscript`](./Hyperscript.es6.js) module exports the `h()` function to
constructor VTrees. It is mainly a convenience wrapper around the constructors
from the [`VTree`](./VTree.es6.js) module. This module exports the `Element` and
`Text` data constructors to which `h()` delegates.

The [`cfComponentBridge`](./CfComponentBridgeDirective.js) directive gets a
VTree from the scope and renders it into the DOM whenever it changes. It uses
the `createMountPoint()` function from the [`DOMRenderer`](./DOMRenderer.es6.js)
module. This function converts our representation of a VTree into a
representation that can be understood by React and then uses React’s
`render()` function to mount that tree.

The [`StringRenderer`](./StringRenderer.es6.js) exports the `renderToString()`
function that turns a VTree into an HTML string. This is used in the legacy
module `utils/hyperscript` module.
