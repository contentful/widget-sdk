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

const WebhooksFetcher = createFetcherComponent(() => {
  return spaceContext.webhookRepo.getAll();
});

export class WebhookListRoute extends React.Component {
  static propTypes = {
    templateId: PropTypes.string
  };

  render() {
    const openTemplateDialog = createWebhookTemplateDialogOpener({
      webhookRepo: spaceContext.webhookRepo,
      contentTypes: spaceContext.publishedCTs.getAllBare(),
      defaultLocaleCode: get(TheLocaleStore.getDefaultLocale(), ['code'], 'en-US'),
      domain: Config.domain,
      onCreate: ([firstSaved]) => $state.go('^.detail', { webhookId: firstSaved.sys.id })
    });
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
            return (
              <WebhookList
                templateId={this.props.templateId}
                webhooks={data}
                openTemplateDialog={openTemplateDialog}
              />
            );
          }}
        </WebhooksFetcher>
      </AdminOnly>
    );
  }
}

export default WebhookListRoute;
