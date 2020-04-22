import React from 'react';
import PropTypes from 'prop-types';
import * as Navigator from 'states/Navigator';
import { track } from 'analytics/Analytics';

const StateLink = ({
  path,
  params,
  options,
  children,
  onClick,
  component,
  trackingEvent,
  trackParams,
  ...rest
}) => {
  const trackClick = () => {
    if (trackingEvent && trackParams) {
      track(trackingEvent, trackParams);
    }
  };

  const onClickHandler = (e) => {
    trackClick();

    if (!e) {
      Navigator.go({ path, params, options });
      return;
    }

    if (e.shiftKey || e.ctrlKey || e.metaKey || rest.target === '_blank') {
      // allow to open in a new tab/window normally
    } else {
      // perform Angular UI router transition only
      e.preventDefault();
      Navigator.go({ path, params, options });
      if (onClick) {
        onClick(e);
      }
    }
  };

  if (typeof children === 'function') {
    return children({
      getHref: () => Navigator.href({ path, params, options }),
      onClick: onClickHandler,
    });
  }

  const Component = component || 'a';

  return (
    <Component {...rest} href={Navigator.href({ path, params })} onClick={onClickHandler}>
      {children}
    </Component>
  );
};

StateLink.propTypes = {
  path: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]).isRequired,
  params: PropTypes.object,
  options: PropTypes.object,
  children: PropTypes.any,
  onClick: PropTypes.func,
  component: PropTypes.any,
  trackingEvent: PropTypes.string,
  trackParams: PropTypes.object,
};

export default StateLink;
