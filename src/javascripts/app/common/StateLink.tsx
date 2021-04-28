import React from 'react';
import * as Navigator from 'states/Navigator';
import { track } from 'analytics/Analytics';
import type { EventData } from 'analytics/types';

export type StateLinkChildrenFn = (params: {
  getHref: () => string;
  onClick: (e?: any) => unknown;
}) => React.ReactNode;

export type StateLinkProps = {
  path: string | string[];
  children?: React.ReactNode | StateLinkChildrenFn;
  params?: { [key: string]: unknown };
  options?: { [key: string]: unknown };
  onClick?: (e?: unknown) => unknown;
  component?: React.FunctionComponent;
  trackingEvent?: string;
  trackParams?: EventData;
  target?: '_blank';
  rel?: string;
};

export const StateLink = ({
  path,
  params,
  options,
  children,
  onClick,
  component,
  trackingEvent,
  trackParams,
  ...rest
}: StateLinkProps) => {
  const trackClick = () => {
    if (trackingEvent) {
      track(trackingEvent, trackParams);
    }
  };

  const onClickHandler = (e) => {
    trackClick();

    if (!e) {
      Navigator.go({ path, params, options });
      return;
    }

    // if should allow to open in a new tab/window normally do not perform Angular UI router transition
    if (!(e.shiftKey || e.ctrlKey || e.metaKey || rest.target === '_blank')) {
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

  const href = Navigator.href({ path, params });

  return (
    <Component {...rest} href={href} onClick={onClickHandler}>
      {children}
    </Component>
  );
};

export default StateLink;
