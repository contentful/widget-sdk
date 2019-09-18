import React from 'react';
import { Spinner, Card } from '@contentful/forma-36-react-components';
import { getModule } from 'NgRegistry.es6';

export default function LoadingModal() {
  const spinnerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%'
  };

  return (
    <div style={spinnerStyle}>
      <Card padding="large">
        <Spinner size="large" />
      </Card>
    </div>
  );
}

export function openModal() {
  const modalDialog = getModule('modalDialog');

  return modalDialog.open({
    title: 'Loading',
    template:
      '<react-component name="components/shared/LoadingModal.es6" class="modal-background"></react-component>',
    backgroundClose: false,
    persistOnNavigation: false,
    scopeData: {}
  });
}
