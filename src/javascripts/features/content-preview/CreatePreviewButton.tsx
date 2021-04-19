import React from 'react';
import { Button } from '@contentful/forma-36-react-components';
import { RouteLink } from 'core/react-routing';

export function CreatePreviewButton() {
  return (
    <RouteLink route={{ path: 'content_preview.new' }}>
      {({ onClick }) => (
        <Button
          icon="PlusCircle"
          buttonType="primary"
          onClick={onClick}
          testId="add-content-preview-button">
          Add content preview
        </Button>
      )}
    </RouteLink>
  );
}
