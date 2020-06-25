import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { Note, Paragraph, TextLink } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { track } from 'analytics/Analytics';
import * as TokenStore from 'services/TokenStore';
import { getOrgFeature } from 'data/CMA/ProductCatalog';
import { useAsync } from 'core/hooks';
import { showDialog as showChangeSpaceModal } from 'services/ChangeSpaceService';
import { isOwner } from 'services/OrganizationRoles';

const styles = {
  warningContainer: css({
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
    track('asset_list:upgrade_plan_link_clicked', {
      organizationId,
      spaceId,
    });

    showChangeSpaceModal({
      organizationId,
      space,
    });
  };

  return (
    <div className={styles.warningContainer}>
      <Note testId="asset-limit-warning">
        <Paragraph>The free community tier has a size limit of 50MB per asset.</Paragraph>
        <Paragraph>
          To increase your limit,{' '}
          {isOwner(organization) ? (
            <>
              <TextLink onClick={onUpgradeSpace} testId="asset-limit-upgrade-link">
                upgrade this space
              </TextLink>
              .
            </>
          ) : (
            <>the organization admin must upgrade this space.</>
          )}
        </Paragraph>
      </Note>
    </div>
  );
}

FileSizeLimitWarning.propTypes = {
  organizationId: PropTypes.string.isRequired,
  spaceId: PropTypes.string.isRequired,
};

export default FileSizeLimitWarning;
