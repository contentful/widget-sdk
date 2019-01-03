import React from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'NgRegistry.es6';

const $state = getModule('$state');

const StateLink = ({ to, params, options, children, ...rest }) => {
  if (typeof children === 'function') {
    return children({
      getHref: () => $state.href(to, params),
      onClick: () => $state.go(to, params, options)
    });
  }
  return (
    <a
      {...rest}
      href={$state.href(to, params)}
      onClick={e => {
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          // allow to open in a new tab/window normally
        } else {
          // perform Angular UI router transition only
          e.preventDefault();
          $state.go(to, params, options);
        }
      }}>
      {children}
    </a>
  );
};

StateLink.propTypes = {
  to: PropTypes.string.isRequired,
  params: PropTypes.object,
  options: PropTypes.object,
  children: PropTypes.any
};

export default StateLink;
