import React from 'react';
import { ActionPerformer } from '../ActionPerformer';

// eslint-disable-next-line no-unused-vars
export const ActionPerformerName = ({ children, ...props }) => (
  <ActionPerformer {...props}>
    {({ formattedName }) => <span data-test-id="action-performer-name">{formattedName}</span>}
  </ActionPerformer>
);
