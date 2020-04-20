import React from 'react';
import { Button } from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink';

export function CreatePreviewButton() {
  return (
    <StateLink path="^.new">
      {({ onClick }) => (
        <Button
          icon="PlusCircle"
          buttonType="primary"
          onClick={onClick}
          testId="add-content-preview-button">
          Add content preview
        </Button>
      )}
    </StateLink>
  );
}
