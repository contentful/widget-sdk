import React from 'react';
import PropTypes from 'prop-types';
import * as Navigator from 'states/Navigator';

const StateLink = ({ to, params, options, children, ...rest }) => {
  if (typeof children === 'function') {
    return children({
      getHref: () => Navigator.href({ path: to, params, options }),
      onClick: () => Navigator.go({ path: to, params, options })
    });
  }
  return (
    <a
      {...rest}
      href={Navigator.href({ path: to, params })}
      onClick={e => {
        if (e.shiftKey || e.ctrlKey || e.metaKey || rest.target === '_blank') {
          // allow to open in a new tab/window normally
        } else {
          // perform Angular UI router transition only
          e.preventDefault();
          Navigator.go({ path: to, params, options });
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
