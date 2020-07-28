import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { Note, Paragraph, TextLink } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import * as TokenStore from 'services/TokenStore';
import { getOrgFeature } from 'data/CMA/ProductCatalog';
import { useAsync } from 'core/hooks';
import { showDialog as showChangeSpaceModal } from 'services/ChangeSpaceService';
import { isOwner } from 'services/OrganizationRoles';
import { trackTargetedCTAClick, CTA_EVENTS } from 'analytics/trackCTA';
import TrackTargetedCTAImpression from 'app/common/TrackTargetedCTAImpression';

const styles = {
  marginBottom: css({
    marginBottom: tokens.spacingM,
  }),
};

const fetch = (organizationId, spaceId) => async () => {
  const [organization, space, hasUnlimitedFileSize] = await Promise.all([
    TokenStore.getOrganization(organizationId),
    TokenStore.getSpace(spaceId),
    getOrgFeature(organizationId, 'unlimited_asset_file_size', false),
  ]);

  return {
    organization,
    space,
    hasUnlimitedFileSize,
  };
};

function FileSizeLimitWarning({ organizationId, spaceId }) {
  const { isLoading, error, data } = useAsync(useCallback(fetch(organizationId, spaceId), []));

  if (isLoading || error || data.hasUnlimitedFileSize) {
    return null;
  }

  const { space, organization } = data;

  const onUpgradeSpace = () => {
    trackTargetedCTAClick(CTA_EVENTS.UPGRADE_SPACE_PLAN, {
      organizationId,
      spaceId,
    });

    showChangeSpaceModal({
      organizationId,
      space,
    });
  };

  return (
    <Note className={styles.marginBottom} testId="asset-limit-warning">
      <Paragraph>The free community tier has a size limit of 50MB per asset.</Paragraph>
      <Paragraph>
        To increase your limit,{' '}
        {isOwner(organization) ? (
          <TrackTargetedCTAImpression
            impressionType={CTA_EVENTS.UPGRADE_SPACE_PLAN}
            meta={{ organizationId, spaceId }}>
            <TextLink onClick={onUpgradeSpace} testId="asset-limit-upgrade-link">
              upgrade this space
            </TextLink>
            .
          </TrackTargetedCTAImpression>
        ) : (
          <>the organization admin must upgrade this space.</>
        )}
      </Paragraph>
    </Note>
  );
}

FileSizeLimitWarning.propTypes = {
  organizationId: PropTypes.string.isRequired,
  spaceId: PropTypes.string.isRequired,
};

export default FileSizeLimitWarning;
