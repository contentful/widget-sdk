import React from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'NgRegistry.es6';

const StateLink = ({ to, params, options, children, ...rest }) => {
  const $state = getModule('$state');

  if (typeof children === 'function') {
    return children({
      getHref: () => $state.href(to, params, options),
      onClick: () => $state.go(to, params, options)
    });
  }
  return (
    <a
      {...rest}
      href={$state.href(to, params)}
      onClick={e => {
        if (e.shiftKey || e.ctrlKey || e.metaKey || rest.target === '_blank') {
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
