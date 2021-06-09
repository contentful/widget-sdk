import React, { useCallback, useState } from 'react';
import {
  Heading,
  Note,
  Paragraph,
  SkeletonBodyText,
  SkeletonContainer,
  Workbench,
} from '@contentful/forma-36-react-components';
import { ContentTypeList } from './ContentTypeList';
import { NoSearchResultsAdvice } from 'core/components/NoSearchResultsAdvice';
import { NoContentTypeAdvice } from 'core/components/NoContentTypeAdvice';
import { CreateContentTypeCta } from '../CreateContentTypeCta';
import KnowledgeBase, {
  KnowledgeBaseItems,
} from 'components/shared/knowledge_base_icon/KnowledgeBase';
import { ContentTypeListSearch } from './ContentTypeListSearch';
import { ContentTypeListFilter } from './ContentTypeListFilter';
import * as service from './ContentTypeListService';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { css } from 'emotion';
import ExternalTextLink from 'app/common/ExternalTextLink';
import { getResourceLimits } from 'utils/ResourceUtils';
import { CTA_EVENTS, trackTargetedCTAClick } from 'analytics/trackCTA';
import { CONTACT_SALES_URL_WITH_IN_APP_BANNER_UTM } from 'analytics/utmLinks';
import TrackTargetedCTAImpression from 'app/common/TrackTargetedCTAImpression';
import * as PricingService from 'services/PricingService';
import createResourceService from 'services/ResourceService';
import { useAsync } from 'core/hooks';
import { debounce } from 'lodash';
import qs from 'qs';
import tokens from '@contentful/forma-36-tokens';
import type { Organization } from 'classes/spaceContextTypes';
import { useLegacyQueryParams } from 'core/react-routing/useLegacyQueryParams';

const styles = {
  banner: css({
    marginBottom: tokens.spacingL,
  }),
  knowledgeBaseIcon: css({
    lineHeight: tokens.lineHeightXl,
    marginLeft: tokens.spacing2Xs,
    padding: `0 ${tokens.spacing2Xs}`,
    fontSize: tokens.fontSizeXl,
    display: 'flex',
  }),
};
type Props = {
  spaceId: string;
  environmentId: string;
  currentOrganization: Organization;
  currentOrganizationId: string;
};

export function ContentTypeListPage({
  spaceId,
  environmentId,
  currentOrganization,
  currentOrganizationId,
}: Props) {
  const { searchQuery, updateSearchQuery } = useLegacyQueryParams();
  const queryValues = searchQuery ? qs.parse(searchQuery.slice(1)) : {};
  const [searchTerm, setSearchTerm] = useState(queryValues ? queryValues.searchTerm : null);
  const [status, setStatus] = useState(undefined);

  const getData = useCallback(async () => {
    // This is written so that the important data (contentTypes) only would wait for a max of 2 seconds for the
    // less important banner information to load. Having them load together prevents the page jumping when the
    // banner information loads second, but if the banner information would take more than 2 seconds to load,
    // it's more important that we allow the user to use the page than wait longer for this less important information.

    const promisesArray = [service.fetchContentTypes()];
    const isOrgAdminOrOwner = isOwnerOrAdmin(currentOrganization);

    // fetch only if admin or owner
    if (isOrgAdminOrOwner) {
      promisesArray.push(
        Promise.race([
          Promise.all([
            PricingService.nextSpacePlanForResource(
              currentOrganizationId,
              spaceId,
              PricingService.SPACE_PLAN_RESOURCE_TYPES.CONTENT_TYPE
            ),
            createResourceService(spaceId).get('contentType', environmentId),
          ]),
          new Promise((resolve) => setTimeout(resolve, 2 * 1000)),
        ])
      );
    }

    const [contentTypeItems, communityBannerData] = await Promise.all(promisesArray);

    let showContentTypeLimitBanner = false;
    let usage = 0;
    let limit = 0;

    // If there is communityBannerData then the user isOrgAdminOrOwner, so we can then determine if we should show the CTA to upgrade to enterprise.
    if (communityBannerData) {
      const [nextSpacePlan, resource] = communityBannerData;
      usage = resource.usage;
      limit = getResourceLimits(resource).maximum;
      showContentTypeLimitBanner =
        !nextSpacePlan && usage / limit >= PricingService.WARNING_THRESHOLD;
    }

    return {
      contentTypes: contentTypeItems,
      showContentTypeLimitBanner,
      usage,
      limit,
    };
  }, [currentOrganization, currentOrganizationId, spaceId, environmentId]);

  const { isLoading, data } = useAsync(getData);
  const debouncedSearch = useCallback(
    debounce<(term: string) => void>((searchTerm) => {
      setSearchTerm(searchTerm);
      updateSearchQuery({ searchTerm });
    }, 200),
    []
  );

  const search = (value) => {
    debouncedSearch(value);
  };

  const handleBannerClickCTA = () => {
    trackTargetedCTAClick(CTA_EVENTS.UPGRADE_TO_ENTERPRISE, {
      spaceId,
      organizationId: currentOrganizationId,
    });
  };

  const renderSidebar = () => {
    if (!isLoading && data?.contentTypes.length === 0) {
      return null;
    }

    return (
      <Workbench.Sidebar position="left">
        {!isLoading && (
          <ContentTypeListFilter status={status} onChange={(status) => setStatus(status)} />
        )}
      </Workbench.Sidebar>
    );
  };

  let filteredContentTypes = [];
  if (!isLoading) {
    filteredContentTypes = service.filterContentTypes(data?.contentTypes || [], {
      searchTerm,
      status,
    });
  }

  return (
    <Workbench>
      <Workbench.Header
        icon={<ProductIcon icon="ContentModel" size="large" />}
        title={
          <>
            <Heading>Content Model</Heading>
            <div className={styles.knowledgeBaseIcon}>
              <KnowledgeBase target={KnowledgeBaseItems.content_model} asIcon />
            </div>
          </>
        }
        actions={
          <>
            {!isLoading && data?.contentTypes.length > 0 && (
              <ContentTypeListSearch searchTerm={searchTerm} onChange={(value) => search(value)} />
            )}
            {!isLoading && data?.contentTypes.length > 0 && (
              <CreateContentTypeCta testId="create-content-type" />
            )}
          </>
        }
      />

      {renderSidebar()}

      <Workbench.Content type="full">
        {isLoading ? (
          <SkeletonContainer
            data-test-id="content-loader"
            ariaLabel="Loading Content Type list"
            svgWidth="100%">
            <SkeletonBodyText numberOfLines={2} />
            <SkeletonBodyText numberOfLines={2} offsetTop={75} />
            <SkeletonBodyText numberOfLines={2} offsetTop={150} />
            <SkeletonBodyText numberOfLines={2} offsetTop={225} />
            <SkeletonBodyText numberOfLines={2} offsetTop={300} />
            <SkeletonBodyText numberOfLines={2} offsetTop={375} />
          </SkeletonContainer>
        ) : (
          <React.Fragment>
            {data?.showContentTypeLimitBanner && (
              <Note noteType="primary" className={styles.banner} testId="content-type-limit-banner">
                <Paragraph>
                  You’ve used {data.usage} of {data.limit} content types.
                </Paragraph>
                <Paragraph>
                  To increase the limit,{' '}
                  <TrackTargetedCTAImpression
                    impressionType={CTA_EVENTS.UPGRADE_TO_ENTERPRISE}
                    meta={{ spaceId, organizationId: currentOrganizationId }}>
                    <ExternalTextLink
                      testId="link-to-sales"
                      href={CONTACT_SALES_URL_WITH_IN_APP_BANNER_UTM}
                      onClick={() => handleBannerClickCTA()}>
                      talk to us
                    </ExternalTextLink>{' '}
                  </TrackTargetedCTAImpression>
                  about upgrading to the enterprise tier.
                </Paragraph>
              </Note>
            )}

            {filteredContentTypes.length > 0 && (
              <div data-test-id="content-type-list">
                <ContentTypeList contentTypes={filteredContentTypes} />
              </div>
            )}
            {data?.contentTypes.length > 0 && filteredContentTypes.length === 0 && (
              <div data-test-id="no-search-results">
                <NoSearchResultsAdvice />
              </div>
            )}
            {data?.contentTypes.length === 0 && (
              <div data-test-id="empty-state">
                <NoContentTypeAdvice />
              </div>
            )}
          </React.Fragment>
        )}
      </Workbench.Content>
    </Workbench>
  );
}
