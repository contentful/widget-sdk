import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { TextLink, Note, Paragraph } from '@contentful/forma-36-react-components';
import { getVariation } from 'LaunchDarkly';
import { PRICING_2020_RELEASED } from 'featureFlags';
import { showDialog as showChangeSpaceModal } from 'services/ChangeSpaceService';
import { showDialog as showCreateSpaceModal } from 'services/CreateSpace';
import * as TokenStore from 'services/TokenStore';
import { isOwner } from 'services/OrganizationRoles';
import { Space as SpacePropType } from 'app/OrganizationSettings/PropTypes';
import { getBasePlan, isFreePlan } from 'account/pricing/PricingDataProvider';
import { createOrganizationEndpoint } from 'data/EndpointFactory';
import { isLegacyOrganization } from 'utils/ResourceUtils';
import { trackCTAClick } from 'analytics/targetedCTA';

UserListCommunityBanner.propTypes = {
  orgId: PropTypes.string.isRequired,
  spaces: PropTypes.arrayOf(SpacePropType),
};

const styles = {
  wrapper: css({
    margin: '0 2em',
  }),
};
export function UserListCommunityBanner({ orgId, spaces }) {
  const spaceToUpgrade = spaces && spaces.length > 0 ? spaces[0] : null;
  const [shouldDisplayCommunityBanner, setShouldDisplayCommunityBanner] = useState(false);
  const [userIsOwner, setUserIsOwner] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      // If the organization is billable, they can add more than
      // just the free users so we don't need to tell them to upgrade
      const endpoint = createOrganizationEndpoint(orgId);
      const organization = await TokenStore.getOrganization(orgId);

      // If the base plan can't be fetched (for v1), we can just consider it
      // not free, since the community banner shouldn't show in this case
      // anyway.
      let basePlanIsFree = false;

      if (!isLegacyOrganization(organization)) {
        basePlanIsFree = await getBasePlan(endpoint).then(isFreePlan);
      }
      const variation = getVariation(PRICING_2020_RELEASED, { orgId });
      setShouldDisplayCommunityBanner(variation && basePlanIsFree);
      setUserIsOwner(isOwner(organization));
    };
    fetch();
  }, [orgId]);

  const changeSpace = () => {
    trackCTAClick('upgrade_space_plan', {
      organizationId: orgId,
      spaceId: spaceToUpgrade.sys.id,
    });

    showChangeSpaceModal({
      action: 'change',
      organizationId: orgId,
      space: spaceToUpgrade,
    });
  };

  const createSpace = () => {
    trackCTAClick('create_space', {
      organizationId: orgId,
    });
    showCreateSpaceModal(orgId);
  };

  if (!shouldDisplayCommunityBanner) {
    return null;
  }

  return (
    <Note noteType="primary" className={styles.wrapper}>
      <Paragraph>The free community plan has a limit of 5 users.</Paragraph>
      <Paragraph>
        To increase the limit,{' '}
        {userIsOwner ? (
          <TextLink
            onClick={spaceToUpgrade ? changeSpace : createSpace}
            testId="upgrade-space-plan">
            {spaceToUpgrade ? 'upgrade your free space' : 'purchase a space'}
          </TextLink>
        ) : (
          'the organization owner must upgrade your tier by purchasing or upgrading a space'
        )}
        .
      </Paragraph>
    </Note>
  );
}
