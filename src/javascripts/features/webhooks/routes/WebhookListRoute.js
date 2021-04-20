import React from 'react';
import { get } from 'lodash';
import { WebhookForbiddenPage } from '../WebhookForbiddenPage';
import { WebhookList } from '../WebhookList';
import { WebhookSkeletons } from '../skeletons/WebhookListRouteSkeleton';
import { createWebhookTemplateDialogOpener } from '../createWebhookTemplateDialogOpener';
import createFetcherComponent from 'app/common/createFetcherComponent';
import { getSectionVisibility } from 'access_control/AccessChecker';
import StateRedirect from 'app/common/StateRedirect';
import * as Config from 'Config';
import { getOrgFeature } from 'data/CMA/ProductCatalog';
import DocumentTitle from 'components/shared/DocumentTitle';
import TheLocaleStore from 'services/localeStore';
import { getWebhookRepo } from '../services/WebhookRepoInstance';
import { useSpaceEnvContext, useContentTypes } from 'core/services/SpaceEnvContext';
import * as TokenStore from 'services/TokenStore';
import { useNavigationState, useRouteNavigate } from 'core/react-routing';

const WebhooksFetcher = createFetcherComponent(({ spaceId, organizationId, userEmail }) => {
  const webhookRepo = getWebhookRepo({ spaceId });

  return Promise.all([
    webhookRepo.getAll(),
    getOrgFeature(organizationId, 'webhook_aws_proxy'),
  ]).then(([webhooks, hasAwsProxyFeature]) => {
    const isContentfulUser = (userEmail || '').endsWith('@contentful.com');
    const hasAwsProxy = hasAwsProxyFeature || isContentfulUser;
    return [webhooks, hasAwsProxy];
  });
});

export function WebhookListRoute() {
  const navigationState = useNavigationState();
  const templateId = navigationState?.templateId ?? null;
  const templateIdReferrer = navigationState?.referrer ?? null;

  const navigate = useRouteNavigate();

  const { email: userEmail } = TokenStore.getUserSync();
  const { currentSpaceId, currentOrganizationId } = useSpaceEnvContext();
  const { currentSpaceContentTypes } = useContentTypes();

  function setupTemplateOpener(hasAwsProxy = false) {
    return createWebhookTemplateDialogOpener(
      {
        contentTypes: currentSpaceContentTypes,
        defaultLocaleCode: get(TheLocaleStore.getDefaultLocale(), ['code'], 'en-US'),
        domain: Config.domain,
        hasAwsProxy,
      },
      currentSpaceId,
      ({ webhookId }) => {
        navigate({ path: 'webhooks.detail', webhookId });
      }
    );
  }

  if (!getSectionVisibility()['webhooks']) {
    if (templateId) {
      return <WebhookForbiddenPage templateId={templateId} />;
    }

    return <StateRedirect path="spaces.detail.entries.list" />;
  }

  return (
    <WebhooksFetcher
      spaceId={currentSpaceId}
      organizationId={currentOrganizationId}
      userEmail={userEmail}>
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
              templateId={templateId}
              templateIdReferrer={templateIdReferrer}
              webhooks={webhooks}
              openTemplateDialog={setupTemplateOpener(hasAwsProxy)}
            />
          </React.Fragment>
        );
      }}
    </WebhooksFetcher>
  );
}
