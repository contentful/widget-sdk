import React from 'react';
import PropTypes from 'prop-types';
import * as Navigator from 'states/Navigator';

const StateLink = ({ to, params, options, children, onClick, ...rest }) => {
  const onClickHandler = e => {
    if (!e) {
      Navigator.go({ path: to, params, options });
      return;
    }

    if (e.shiftKey || e.ctrlKey || e.metaKey || rest.target === '_blank') {
      // allow to open in a new tab/window normally
    } else {
      // perform Angular UI router transition only
      e.preventDefault();
      Navigator.go({ path: to, params, options });
      if (onClick) {
        onClick(e);
      }
    }
  };

  if (typeof children === 'function') {
    return children({
      getHref: () => Navigator.href({ path: to, params, options }),
      onClick: onClickHandler
    });
  }
  return (
    <a {...rest} href={Navigator.href({ path: to, params })} onClick={onClickHandler}>
      {children}
    </a>
  );
};

StateLink.propTypes = {
  to: PropTypes.string.isRequired,
  params: PropTypes.object,
  options: PropTypes.object,
  children: PropTypes.any,
  onClick: PropTypes.func
};

export default StateLink;
