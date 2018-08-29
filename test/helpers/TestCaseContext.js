import { entries } from 'lodash';
import { createUI } from 'helpers/DOM';

/**
 * This module defines the test case context. That is the methods
 * available on `this` in `it()`, `beforeEach()`, and `afterEach()`.
 *
 * We have the following methods.
 *
 * - `registerTeardown(fn)`. Registers the passed function to be called
 *   after the test. This happens after all other `afterEach()` hooks.
 *   The funciton is called with the test case context as 'this'.
 *
 * - `createUI()`. Creates an object to test and interact with UIs. For
 *   more information see 'test/helpers/DOM'.
 *
 * The context is installed in 'test/helpers/boot'.
 */
export default function install() {
  beforeEach(function() {
    setupContext(this);
  });
  afterEach(function() {
    this._teardown.forEach(fn => fn.call(this));
  });
}

function setupContext(ctx) {
  mixin(ctx, {
    _teardown: [],
    registerTeardown(fn) {
      ctx._teardown.push(fn);
    },
    createUI(parameters) {
      const ui = createUI(parameters);
      this.registerTeardown(() => ui.destroy());
      return ui;
    }
  });
}

/**
 * Adds all properties from `source` as read-only properties to
 * `target`.
 */
function mixin(target, source) {
  entries(source).forEach(([key, value]) => {
    Object.defineProperty(target, key, {
      writable: false,
      value: value
    });
  });
}
