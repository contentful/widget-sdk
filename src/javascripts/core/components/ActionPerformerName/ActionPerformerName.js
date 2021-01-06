import React from 'react';
import { ActionPerformer } from '../ActionPerformer';

export const ActionPerformerName = ({ ...props }) => (
  <ActionPerformer {...props}>
    {({ formattedName, formattedNameAsString }) => (
      <span data-test-id="action-performer-name" title={formattedNameAsString}>
        {formattedName}
      </span>
    )}
  </ActionPerformer>
);
