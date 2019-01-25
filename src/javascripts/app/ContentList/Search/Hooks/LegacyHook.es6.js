/* eslint-disable no-restricted-syntax, react/prop-types, camelcase */
import React from 'react';
import { clone, get } from 'lodash';
import { set } from 'utils/Collections.es6';

/**
 * @deprecated
 * A React component that runs hooks.
 * The Hook component is a stateful component that runs hooks that are
 * added or removed from the properties.
 * This class is a leftover of refactoring from Hyperscript to JSX.
 * It should be deleted on the next iteration of ContentList/Search refactoring.
 * Please, don't use it in any new code.
 */
export default class LegacyHook extends React.Component {
  constructor() {
    super();
    this.hooks = {
      prev: {},
      next: {},
      state: {}
    };
  }
  componentDidMount() {
    this.hooks.next = hookMap(this.props.args.hooks);
    this.applyHooks();
  }
  UNSAFE_componentWillReceiveProps(nextProps) {
    this.hooks.prev = this.hooks.next;
    this.hooks.next = hookMap(nextProps.args.hooks);
  }
  componentWillUnmount() {
    this.hooks.prev = this.hooks.next;
    this.hooks.next = {};
    this.hooks.el = null;
    this.applyHooks();
  }

  UNSAFE_componentWillUpdate() {
    this.applyHooks();
  }

  componentDidUpdate() {
    this.applyHooks();
  }

  render() {
    const {
      args: { tag, ref },
      children,
      ...restProps
    } = this.props;

    return React.createElement(
      tag,
      {
        ...restProps,
        ref: el => {
          this.hooks.el = el;
          ref && ref(el);
        }
      },
      children
    );
  }

  applyHooks() {
    const { next, prev, state, el } = this.hooks;

    // Previous hooks that are not in `next`.
    const remove = clone(prev);
    Object.keys(next).forEach(key => {
      const nextHook = next[key];
      const prevHook = prev[key];
      delete remove[key];
      const prevState = state[key];
      state[key] = nextHook.run(el, prevState, get(prevHook, 'content'), get(nextHook, 'content'));
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
function hookMap(hooks) {
  return hooks.reduce((hookMap, hook) => {
    return set(hookMap, hook.tag, hook.value);
  }, {});
}
