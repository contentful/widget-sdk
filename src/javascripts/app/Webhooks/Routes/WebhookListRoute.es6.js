import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import WebhookForbiddenPage from '../WebhookForbiddenPage.es6';
import WebhookList from '../WebhookList.es6';
import createWebhookTemplateDialogOpener from '../createWebhookTemplateDialogOpener.es6';

const ServicesConsumer = require('../../../reactServiceContext').default;

class WebhooksFetcher extends React.Component {
  static propTypes = {
    fetcher: PropTypes.func.isRequired,
    children: PropTypes.func.isRequired
  };

  state = {
    isLoaded: false,
    webhooks: []
  };

  componentDidMount() {
    this.props
      .fetcher()
      .then(webhooks => {
        this.setState({ isLoaded: true, webhooks });
      })
      .catch(() => {
        this.setState({ isLoaded: true, webhooks: [] });
      });
  }

  render() {
    return this.props.children(this.state);
  }
}

export class WebhookListRoute extends React.Component {
  static propTypes = {
    $services: PropTypes.shape({
      spaceContext: PropTypes.object.isRequired,
      modalDialog: PropTypes.object.isRequired,
      TheLocaleStore: PropTypes.object.isRequired,
      Config: PropTypes.object.isRequired,
      $state: PropTypes.object.isRequired
    }).isRequired,
    templateId: PropTypes.string
  };

  state = {
    isLoading: true
  };

  static getDerivedStateFromProps(props) {
    return {
      isAdmin: !!props.$services.spaceContext.getData('spaceMembership.admin', false)
    };
  }

  render() {
    if (!this.state.isAdmin) {
      return <WebhookForbiddenPage templateId={this.props.templateId} />;
    }
    const { TheLocaleStore, spaceContext, modalDialog, Config } = this.props.$services;
    const openTemplateDialog = createWebhookTemplateDialogOpener({
      webhookRepo: spaceContext.webhookRepo,
      contentTypes: spaceContext.publishedCTs.getAllBare(),
      defaultLocaleCode: get(TheLocaleStore.getDefaultLocale(), ['code'], 'en-US'),
      domain: Config.domain,
      modalDialog,
      onCreate: ([firstSaved]) =>
        this.props.$services.$state.go('^.detail', { webhookId: firstSaved.sys.id })
    });
    return (
      <WebhooksFetcher fetcher={() => spaceContext.webhookRepo.getAll()}>
        {({ isLoaded, webhooks }) => {
          if (!isLoaded) {
            return null;
          }
          return (
            <WebhookList
              templateId={this.props.templateId}
              webhooks={webhooks}
              webhookRepo={spaceContext.webhookRepo}
              openTemplateDialog={openTemplateDialog}
            />
          );
        }}
      </WebhooksFetcher>
    );
  }
}

export default ServicesConsumer('$state', 'spaceContext', 'modalDialog', 'TheLocaleStore', {
  as: 'Config',
  from: 'Config.es6'
})(WebhookListRoute);
