import React from 'react';
import PropTypes from 'prop-types';

import $state from '$state';

import WebhookSidebarDocumentation from './WebhookSidebarDocumentation.es6';
import WebhookSidebarTemplatesList from './WebhookSidebarTemplatesList.es6';

export default function WebhookListSidebar(props) {
  const {
    webhooks,
    webhookRepo,
    templateContentTypes,
    openTemplateDialog
  } = props;

  return (
    <div className="entity-sidebar">
      <h2 className="entity-sidebar__heading">Add Webhooks</h2>
      <p>
        Your space
        {webhooks.length < 1 && " isn't using any webhooks."}
        {webhooks.length === 1 && ' is using 1 webhook.'}
        {webhooks.length > 1 && ` is using ${webhooks.length} webhooks.`}
      </p>
      <button
        className="btn-action add-entity x--block"
        onClick={() => $state.go('^.new')}
        data-test-id="add-webhook-button">
        <i className="fa fa-plus-circle" /> Add Webhook
      </button>
      <WebhookSidebarDocumentation />
      <WebhookSidebarTemplatesList
        webhookRepo={webhookRepo}
        templateContentTypes={templateContentTypes}
        openTemplateDialog={openTemplateDialog}
      />
    </div>
  );
}

WebhookListSidebar.propTypes = {
  webhooks: PropTypes.array.isRequired,
  webhookRepo: PropTypes.object.isRequired,
  templateContentTypes: PropTypes.array.isRequired,
  openTemplateDialog: PropTypes.func.isRequired
};
