import React from 'react';
import { Tooltip } from '@contentful/forma-36-react-components';
import { MAX_KEYS_ALLOWED } from 'features/apps/config';

export const WithLimitTooltip = ({ children, enabled }) => {
  return enabled ? (
    <Tooltip content={`You've reached the limit of ${MAX_KEYS_ALLOWED} key pairs`}>
      {children}
    </Tooltip>
  ) : (
    children
  );
};
