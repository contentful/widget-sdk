import React from 'react';
import PropTypes from 'prop-types';
import WebhookEditor from '../WebhookEditor';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import DocumentTitle from 'components/shared/DocumentTitle';
import { getSectionVisibility } from 'access_control/AccessChecker';

export class WebhookNewRoute extends React.Component {
  static propTypes = {
    registerSaveAction: PropTypes.func.isRequired,
    setDirty: PropTypes.func.isRequired
  };

  state = {
    webhook: { headers: [], topics: ['*.*'] }
  };

  render() {
    if (!getSectionVisibility()['webhooks']) {
      return <ForbiddenPage />;
    }

    return (
      <React.Fragment>
        <DocumentTitle title={['New Webhook', 'Webhooks']} />
        <WebhookEditor
          initialWebhook={this.state.webhook}
          registerSaveAction={this.props.registerSaveAction}
          setDirty={this.props.setDirty}
        />
      </React.Fragment>
    );
  }
}

export default WebhookNewRoute;
