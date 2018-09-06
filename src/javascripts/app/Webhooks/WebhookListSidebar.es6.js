import React from 'react';
import PropTypes from 'prop-types';

import $state from '$state';

import WebhookSidebarDocumentation from './WebhookSidebarDocumentation.es6';
import WebhookSidebarTemplatesList from './WebhookSidebarTemplatesList.es6';

export default function WebhookListSidebar({ webhookCount, openTemplateDialog }) {
  return (
    <div className="entity-sidebar">
      <h2 className="entity-sidebar__heading">Add Webhooks</h2>
      <p>
        Your space
        {webhookCount < 1 && " isn't using any webhooks."}
        {webhookCount === 1 && ' is using 1 webhook.'}
        {webhookCount > 1 && ` is using ${webhookCount} webhooks.`}
      </p>
      <button
        className="btn-action add-entity x--block"
        onClick={() => $state.go('^.new')}
        data-test-id="add-webhook-button">
        <i className="fa fa-plus-circle" /> Add Webhook
      </button>
      <WebhookSidebarDocumentation />
      <WebhookSidebarTemplatesList openTemplateDialog={openTemplateDialog} />
    </div>
  );
}

WebhookListSidebar.propTypes = {
  webhookCount: PropTypes.number.isRequired,
  openTemplateDialog: PropTypes.func.isRequired
};
