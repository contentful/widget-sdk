import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import WebhookForbiddenPage from '../WebhookForbiddenPage.es6';
import WebhookList from '../WebhookList.es6';
import createWebhookTemplateDialogOpener from '../createWebhookTemplateDialogOpener.es6';
import AdminOnly from 'app/common/AdminOnly.es6';
import $state from '$state';
import * as Config from 'Config.es6';
import TheLocaleStore from 'TheLocaleStore';
import spaceContext from 'spaceContext';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import { isEnterpriseV2 } from 'data/isEnterprise.es6';

const WebhooksFetcher = createFetcherComponent(() => {
  return Promise.all([
    spaceContext.webhookRepo.getAll(),
    isEnterpriseV2(spaceContext.organization)
  ]).then(([webhooks, isV2Committed]) => {
    const isContentfulUser = (spaceContext.user.email || '').endsWith('@contentful.com');
    const hasAwsProxy = isV2Committed || isContentfulUser;
    return [webhooks, hasAwsProxy];
  });
});

export class WebhookListRoute extends React.Component {
  static propTypes = {
    templateId: PropTypes.string
  };

  setupTemplateOpener(hasAwsProxy = false) {
    return createWebhookTemplateDialogOpener({
      webhookRepo: spaceContext.webhookRepo,
      contentTypes: spaceContext.publishedCTs.getAllBare(),
      defaultLocaleCode: get(TheLocaleStore.getDefaultLocale(), ['code'], 'en-US'),
      domain: Config.domain,
      hasAwsProxy,
      onCreate: ([firstSaved]) => $state.go('^.detail', { webhookId: firstSaved.sys.id })
    });
  }

  render() {
    return (
      <AdminOnly
        render={StateRedirect => {
          if (this.props.templateId) {
            return <WebhookForbiddenPage templateId={this.props.templateId} />;
          }
          return <StateRedirect to="spaces.detail.entries.list" />;
        }}>
        <WebhooksFetcher>
          {({ isLoading, isError, data }) => {
            if (isLoading) {
              return <FetcherLoading message="Loading webhooks..." />;
            }
            if (isError) {
              return <StateRedirect to="spaces.detail.entries.list" />;
            }
            const [webhooks, hasAwsProxy] = data;
            return (
              <WebhookList
                templateId={this.props.templateId}
                webhooks={webhooks}
                openTemplateDialog={this.setupTemplateOpener(hasAwsProxy)}
              />
            );
          }}
        </WebhooksFetcher>
      </AdminOnly>
    );
  }
}

export default WebhookListRoute;
