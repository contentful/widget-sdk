import React from 'react';
import PropTypes from 'prop-types';

import $state from '$state';

import * as ResourceUtils from 'utils/ResourceUtils';
import WebhookSidebarDocumentation from './WebhookSidebarDocumentation';

export default function WebhookListSidebar ({webhooks, resource, organization}) {
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
        {usage < 1 && ' isn\'t using any webhooks.'}
        {usage === 1 && ' is using 1 webhook.'}
        {usage > 1 && ` is using ${usage} webhooks.`}
      </p>
      <button
        className="btn-action add-entity x--block"
        onClick={() => $state.go('^.new')}
        data-test-id="add-webhook-button"
      >
        <i className="fa fa-plus-circle" /> Add Webhook
      </button>
      <WebhookSidebarDocumentation />
    </div>
  );
}

WebhookListSidebar.propTypes = {
  webhooks: PropTypes.array.isRequired,
  resource: PropTypes.object.isRequired,
  organization: PropTypes.object.isRequired
};
