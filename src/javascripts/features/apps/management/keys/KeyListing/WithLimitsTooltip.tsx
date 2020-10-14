import React from 'react';
import { Tooltip } from '@contentful/forma-36-react-components';
import { APP_KEYS_LIMIT } from 'features/apps/limits';

export const WithLimitTooltip = ({ children, enabled }) => {
  return enabled ? (
    <Tooltip
      testId="ctf-limit-tooltip"
      content={`You've reached the limit of ${APP_KEYS_LIMIT} key pairs`}>
      {children}
    </Tooltip>
  ) : (
    children
  );
};
