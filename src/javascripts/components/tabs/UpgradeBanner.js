import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { useAsync } from 'core/hooks';
import { css } from 'emotion';

import { getResourceLimits, isLegacyOrganization } from 'utils/ResourceUtils';
import { websiteUrl } from 'Config';
import { showDialog as showUpgradeSpaceDialog } from 'services/ChangeSpaceService';
import { getSingleSpacePlan, isEnterprisePlan } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import ExternalTextLink from 'app/common/ExternalTextLink';

import createResourceService from 'services/ResourceService';
import { Note, Paragraph, TextLink } from '@contentful/forma-36-react-components';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { trackCTAClick } from 'analytics/targetedCTA';

const WARNING_THRESHOLD = 0.9;

const styles = {
  banner: css({
    marginBottom: '12px',
  }),
};

const openUpgradeModal = (space, onSubmit) =>
  showUpgradeSpaceDialog({
    organizationId: space.organization.sys.id,
    space,
    onSubmit,
  });

const fetchRecordsResource = (spaceId) => {
  const service = createResourceService(spaceId);

  return service.get('record');
};

const handleOnUpgradeClick = (space, updateResource) => {
  trackCTAClick('upgrade_space_plan', {
    organizationId: space.organization.sys.id,
    spaceId: space.sys.id,
  });

  openUpgradeModal(space, updateResource);
};
const handleUpgradeToEnterpriseClick = (space) => {
  trackCTAClick('upgrade_to_enterprise', {
    spaceId: space.sys.id,
    organizationId: space.organization.sys.id,
  });
};

export default function UpgradeBanner({ space, isMasterEnvironment }) {
  const updateResource = useCallback(async () => {
    // We only want to make these fetches if the user is an owner or admin && the organization is v2+
    // && it's the master environment
    if (
      !space ||
      !isOwnerOrAdmin(space.organization) ||
      isLegacyOrganization(space.organization) ||
      !isMasterEnvironment
    ) {
      return null;
    }

    const endpoint = createOrganizationEndpoint(space.organization.sys.id);
    const [resource, spacePlan] = await Promise.all([
      fetchRecordsResource(space.sys.id),
      getSingleSpacePlan(endpoint, space.sys.id),
    ]);

    return { resource, spacePlan };
  }, [space, isMasterEnvironment]);

  const { isLoading, data } = useAsync(updateResource);

  if (isLoading) {
    return <div data-test-id="upgrade-banner.is-loading"></div>;
  }

  if (!data) {
    return null;
  }

  const { resource, spacePlan } = data;

  // We don't want to trigger this for enterprise users
  if (isEnterprisePlan(spacePlan)) {
    return null;
  }

  const usage = get(resource, 'usage');
  const limit = getResourceLimits(resource).maximum;

  const isLargeSpace = spacePlan?.name === 'Large';

  const usagePercentage = usage / limit;
  const shouldRenderBanner = usagePercentage >= WARNING_THRESHOLD;

  if (!shouldRenderBanner) {
    return null;
  }

  return (
    <Note noteType="primary" testId="upgrade-banner.container" className={styles.banner}>
      <Paragraph testId="upgrade-banner.usage-text">
        You have used {usage} of {limit} records (total assets and entries).
      </Paragraph>
      <Paragraph testId="upgrade-banner.action-text">
        To increase your limit,{' '}
        {isLargeSpace ? (
          <>
            <ExternalTextLink
              testId="upgrade-banner.upgrade-to-enterprise-link"
              href={websiteUrl('contact/sales/')}
              onClick={() => {
                handleUpgradeToEnterpriseClick(space);
              }}>
              talk to us
            </ExternalTextLink>{' '}
            about upgrading to the enterprise tier
          </>
        ) : (
          <TextLink
            testId="upgrade-banner.upgrade-space-link"
            onClick={() => handleOnUpgradeClick(space, updateResource)}>
            upgrade space
          </TextLink>
        )}
        .
      </Paragraph>
    </Note>
  );
}

UpgradeBanner.propTypes = {
  space: PropTypes.object.isRequired,
  isMasterEnvironment: PropTypes.bool.isRequired,
};
