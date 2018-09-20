import React from 'react';
import PropTypes from 'prop-types';
import WebhookSidebarDocumentation from './WebhookSidebarDocumentation.es6';
import WebhookSidebarTemplatesList from './WebhookSidebarTemplatesList.es6';

const ServicesConsumer = require('../../reactServiceContext').default;

export function WebhookListSidebar({ webhookCount, openTemplateDialog, $services }) {
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
        onClick={() => $services.$state.go('^.new')}
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
  openTemplateDialog: PropTypes.func.isRequired,
  $services: PropTypes.shape({
    $state: PropTypes.object.isRequired
  }).isRequired
};

export default ServicesConsumer('$state')(WebhookListSidebar);
