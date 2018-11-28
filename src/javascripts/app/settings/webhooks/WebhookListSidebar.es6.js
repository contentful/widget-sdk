import React from 'react';
import PropTypes from 'prop-types';
import WebhookSidebarDocumentation from './WebhookSidebarDocumentation.es6';
import WebhookSidebarTemplatesList from './WebhookSidebarTemplatesList.es6';
import { Button } from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink.es6';

function WebhookListSidebar({ webhookCount, openTemplateDialog }) {
  return (
    <div className="entity-sidebar">
      <h2 className="entity-sidebar__heading">Add Webhooks</h2>
      <p>
        Your space
        {webhookCount < 1 && " isn't using any webhooks."}
        {webhookCount === 1 && ' is using 1 webhook.'}
        {webhookCount > 1 && ` is using ${webhookCount} webhooks.`}
      </p>
      <StateLink to="^.new">
        {({ onClick }) => (
          <Button testId="add-webhook-button" icon="PlusCircle" isFullWidth onClick={onClick}>
            Add Webhook
          </Button>
        )}
      </StateLink>
      <WebhookSidebarDocumentation />
      <WebhookSidebarTemplatesList openTemplateDialog={openTemplateDialog} />
    </div>
  );
}

WebhookListSidebar.propTypes = {
  webhookCount: PropTypes.number.isRequired,
  openTemplateDialog: PropTypes.func.isRequired
};

export default WebhookListSidebar;
