/* eslint-disable no-restricted-syntax */
import * as Preact from 'libs/preact';
import { omit, clone, get } from 'lodash';
import { set } from 'utils/Collections';

import { asPreact } from '../DOMRenderer';
import * as VTree from '../VTree';

/**
 * A Preact component that runs hooks.
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
export class Hook extends Preact.Component {
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

  render ({ args: { tag, props, children } }) {
    props = omit(props, ['hooks']);
    const oldRef = props.ref;
    props.ref = el => {
      this.hooks.el = el;
      oldRef && oldRef(el);
    };
    return asPreact(VTree.Element(tag, props, children));
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
