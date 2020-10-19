import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { WebhookForbiddenPage } from '../WebhookForbiddenPage';
import { WebhookList } from '../WebhookList';
import { WebhookSkeletons } from '../skeletons/WebhookListRouteSkeleton';
import { createWebhookTemplateDialogOpener } from '../createWebhookTemplateDialogOpener';
import createFetcherComponent from 'app/common/createFetcherComponent';
import { getSectionVisibility } from 'access_control/AccessChecker';
import StateRedirect from 'app/common/StateRedirect';
import { getModule } from 'core/NgRegistry';
import * as Config from 'Config';
import { getOrgFeature } from 'data/CMA/ProductCatalog';
import DocumentTitle from 'components/shared/DocumentTitle';
import TheLocaleStore from 'services/localeStore';
import { getWebhookRepo } from '../services/WebhookRepoInstance';

const WebhooksFetcher = createFetcherComponent(() => {
  const spaceContext = getModule('spaceContext');
  const webhookRepo = getWebhookRepo();

  return Promise.all([
    webhookRepo.getAll(),
    getOrgFeature(spaceContext.organization.sys.id, 'webhook_aws_proxy'),
  ]).then(([webhooks, hasAwsProxyFeature]) => {
    const isContentfulUser = (spaceContext.user.email || '').endsWith('@contentful.com');
    const hasAwsProxy = hasAwsProxyFeature || isContentfulUser;
    return [webhooks, hasAwsProxy];
  });
});

export class WebhookListRoute extends React.Component {
  static propTypes = {
    templateId: PropTypes.string,
    templateIdReferrer: PropTypes.string,
  };

  setupTemplateOpener(hasAwsProxy = false) {
    const spaceContext = getModule('spaceContext');

    return createWebhookTemplateDialogOpener({
      contentTypes: spaceContext.publishedCTs.getAllBare(),
      defaultLocaleCode: get(TheLocaleStore.getDefaultLocale(), ['code'], 'en-US'),
      domain: Config.domain,
      hasAwsProxy,
    });
  }

  render() {
    if (!getSectionVisibility()['webhooks']) {
      if (this.props.templateId) {
        return <WebhookForbiddenPage templateId={this.props.templateId} />;
      }
      return <StateRedirect path="spaces.detail.entries.list" />;
    }
    return (
      <WebhooksFetcher>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <WebhookSkeletons.WebhooksListLoading />;
          }
          if (isError) {
            return <StateRedirect path="spaces.detail.entries.list" />;
          }
          const [webhooks, hasAwsProxy] = data;
          return (
            <React.Fragment>
              <DocumentTitle title="Webhooks" />
              <WebhookList
                templateId={this.props.templateId}
                templateIdReferrer={this.props.templateIdReferrer}
                webhooks={webhooks}
                openTemplateDialog={this.setupTemplateOpener(hasAwsProxy)}
              />
            </React.Fragment>
          );
        }}
      </WebhooksFetcher>
    );
  }
}
