import React from 'react';
import { Button } from '@contentful/ui-component-library';
import StateLink from 'app/common/StateLink.es6';

export default function CreatePreviewButton() {
  return (
    <StateLink to="^.new">
      {({ onClick }) => (
        <Button
          icon="PlusCircle"
          isFullWidth
          buttonType="primary"
          onClick={onClick}
          testId="add-content-preview-button">
          Add content preview
        </Button>
      )}
    </StateLink>
  );
}
