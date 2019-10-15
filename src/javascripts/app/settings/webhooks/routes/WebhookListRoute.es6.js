import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { SkeletonContainer, SkeletonBodyText } from '@contentful/forma-36-react-components';
import WebhookForbiddenPage from '../WebhookForbiddenPage.es6';
import WebhookList, { WebhookListShell } from '../WebhookList.es6';
import createWebhookTemplateDialogOpener from '../createWebhookTemplateDialogOpener.es6';
import createFetcherComponent from 'app/common/createFetcherComponent.es6';
import { getSectionVisibility } from 'access_control/AccessChecker/index.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import { getModule } from 'NgRegistry.es6';
import * as Config from 'Config.es6';
import { getOrgFeature } from 'data/CMA/ProductCatalog.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import TheLocaleStore from 'services/localeStore.es6';
import { getWebhookRepo } from 'app/settings/webhooks/services/WebhookRepoInstance';

const WebhooksFetcher = createFetcherComponent(() => {
  const spaceContext = getModule('spaceContext');
  const webhookRepo = getWebhookRepo();

  return Promise.all([
    webhookRepo.getAll(),
    getOrgFeature(spaceContext.organization.sys.id, 'webhook_aws_proxy')
  ]).then(([webhooks, hasAwsProxyFeature]) => {
    const isContentfulUser = (spaceContext.user.email || '').endsWith('@contentful.com');
    const hasAwsProxy = hasAwsProxyFeature || isContentfulUser;
    return [webhooks, hasAwsProxy];
  });
});

function WebhooksLoadingSkeleton() {
  return (
    <WebhookListShell>
      <SkeletonContainer
        svgWidth={600}
        svgHeight={300}
        ariaLabel="Loading webhooks"
        clipId="loading-webhooks">
        <SkeletonBodyText numberOfLines={5} offsetLeft={20} marginBottom={15} offsetTop={20} />
      </SkeletonContainer>
    </WebhookListShell>
  );
}

export class WebhookListRoute extends React.Component {
  static propTypes = {
    templateId: PropTypes.string,
    templateIdReferrer: PropTypes.string
  };

  setupTemplateOpener(hasAwsProxy = false) {
    const spaceContext = getModule('spaceContext');

    return createWebhookTemplateDialogOpener({
      contentTypes: spaceContext.publishedCTs.getAllBare(),
      defaultLocaleCode: get(TheLocaleStore.getDefaultLocale(), ['code'], 'en-US'),
      domain: Config.domain,
      hasAwsProxy
    });
  }

  render() {
    if (!getSectionVisibility()['webhooks']) {
      if (this.props.templateId) {
        return <WebhookForbiddenPage templateId={this.props.templateId} />;
      }
      return <StateRedirect to="spaces.detail.entries.list" />;
    }
    return (
      <WebhooksFetcher>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <WebhooksLoadingSkeleton />;
          }
          if (isError) {
            return <StateRedirect to="spaces.detail.entries.list" />;
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

export default WebhookListRoute;
