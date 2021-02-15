import * as React from 'react';
import { WebhookEditor } from '../WebhookEditor';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import DocumentTitle from 'components/shared/DocumentTitle';
import { getSectionVisibility } from 'access_control/AccessChecker';
import { useUnsavedChangesModal } from 'core/hooks/useUnsavedChangesModal/useUnsavedChangesModal';

export function WebhookNewRoute() {
  const initialWebhook = { headers: [], topics: ['*.*'] };
  const { registerSaveAction, setDirty } = useUnsavedChangesModal();

  if (!getSectionVisibility()['webhooks']) {
    return <ForbiddenPage />;
  }

  return (
    <React.Fragment>
      <DocumentTitle title={['New Webhook', 'Webhooks']} />
      <WebhookEditor
        initialWebhook={initialWebhook}
        registerSaveAction={registerSaveAction}
        setDirty={setDirty}
      />
    </React.Fragment>
  );
}
