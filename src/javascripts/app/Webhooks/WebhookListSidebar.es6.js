import React from 'react';
import PropTypes from 'prop-types';

import $state from '$state';

import * as ResourceUtils from 'utils/ResourceUtils.es6';
import WebhookSidebarDocumentation from './WebhookSidebarDocumentation.es6';
import WebhookSidebarTemplatesList from './WebhookSidebarTemplatesList.es6';

export default function WebhookListSidebar(props) {
  const {
    webhooks,
    resource,
    organization,
    webhookRepo,
    templateContentTypes,
    openTemplateDialog
  } = props;

  // Currently, for Version 1 organizations, the usage comes
  // from the token, but this is unreliable as the token is
  // cached. We instead look at the length of the webhooks to
  // show its usage.
  let usage = resource.usage;
  if (ResourceUtils.isLegacyOrganization(organization)) {
    usage = webhooks.length;
  }

  return (
    <div className="entity-sidebar">
      <h2 className="entity-sidebar__heading">Add Webhooks</h2>
      <p>
        Your space
        {usage < 1 && " isn't using any webhooks."}
        {usage === 1 && ' is using 1 webhook.'}
        {usage > 1 && ` is using ${usage} webhooks.`}
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
  resource: PropTypes.object.isRequired,
  organization: PropTypes.object.isRequired,
  webhookRepo: PropTypes.object.isRequired,
  templateContentTypes: PropTypes.array.isRequired,
  openTemplateDialog: PropTypes.func.isRequired
};
