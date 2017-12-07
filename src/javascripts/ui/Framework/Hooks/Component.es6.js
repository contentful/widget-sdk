/* eslint-disable no-restricted-syntax */
import * as React from 'libs/react';
import { omit, clone, get } from 'lodash';
import { set } from 'utils/Collections';

import { asReact } from '../DOMRenderer';
import * as VTree from '../VTree';

/**
 * A React component that runs hooks.
 *
 * Our implementation of `h` translates the following
 *
 *   h(tag, {
 *     hooks: hooks
 *     ...props
 *   }, children)
 *
 * to this React code:
 *
 *   h(Hook, { args: { tag, props, hooks, children })
 *
 * The Hook component is a stateful component that runs hooks that are
 * added or removed from the properties.
 */
export class Hook extends React.Component {
  constructor () {
    super();
    this.hooks = {
      prev: {},
      next: {},
      state: {}
    };
  }
  componentDidMount () {
    this.hooks.next = hookMap(this.props.args.hooks);
    this.applyHooks();
  }
  componentWillReceiveProps (nextProps) {
    this.hooks.prev = this.hooks.next;
    this.hooks.next = hookMap(nextProps.args.hooks);
  }
  componentWillUnmount () {
    this.hooks.prev = this.hooks.next;
    this.hooks.next = {};
    this.hooks.el = null;
    this.applyHooks();
  }

  componentWillUpdate () {
    this.applyHooks();
  }

  componentDidUpdate () {
    this.applyHooks();
  }

  render () {
    const { args: { tag, props, children } } = this.props;
    const propsWithoutHooks = omit(props, ['hooks']);
    const oldRef = props.ref;
    propsWithoutHooks.ref = el => {
      this.hooks.el = el;
      oldRef && oldRef(el);
    };
    return asReact(VTree.Element(tag, propsWithoutHooks, children));
  }

  applyHooks () {
    const { next, prev, state, el } = this.hooks;

    // Previous hooks that are not in `next`.
    const remove = clone(prev);
    Object.keys(next).forEach(key => {
      const nextHook = next[key];
      const prevHook = prev[key];
      delete remove[key];
      const prevState = state[key];
      state[key] = nextHook.run(
        el,
        prevState,
        get(prevHook, 'content'),
        get(nextHook, 'content')
      );
    });

    Object.keys(remove).forEach(key => {
      const prevState = state[key];
      const prevHook = prev[key];
      state[key] = prevHook.run(el, prevState, get(prevHook, 'content'), null);
      delete state[key];
    });
  }
}

/**
 * Take a list of hooks and return an object that maps hook tags to
 * hook values.
 */
function hookMap (hooks) {
  return hooks.reduce((hookMap, hook) => {
    return set(hookMap, hook.tag, hook.value);
  }, {});
}
