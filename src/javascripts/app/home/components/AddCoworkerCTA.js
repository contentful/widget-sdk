import React from 'react';
import PropTypes from 'prop-types';
import styles from '../styles';
import CTACardComponent from './CTACardComponent';
import AddUserIllustration from 'svg/illustrations/add-user-blank.svg';
import { trackClickCTA } from '../tracking';

const AddCoworkerCTA = ({ hasTeamsEnabled, spaceId, orgId }) => {
  return hasTeamsEnabled ? (
    <CTACardComponent
      heading="Add a team member to your space"
      description="Anyone that is already part of your organization can be added to your space."
      ctaLabel="Add a coworker"
      onClick={() => trackClickCTA('teams_organizations_link')}
      href={'/accounts/organizations/' + orgId + '/teams'}
      illustration={<AddUserIllustration className={styles.svgContainerAddUser} />}
    />
  ) : (
    <CTACardComponent
      heading="Add a coworker to your space"
      description="Anyone that is already part of your organization can be added to your space."
      ctaLabel="Add a coworker"
      onClick={() => trackClickCTA('users_settings_link')}
      href={'/spaces/' + spaceId + '/settings/users'}
      illustration={<AddUserIllustration className={styles.svgContainerAddUser} />}
    />
  );
};

AddCoworkerCTA.propTypes = {
  hasTeamsEnabled: PropTypes.bool.isRequired,
  spaceId: PropTypes.string.isRequired,
  orgId: PropTypes.string.isRequired,
};

export default AddCoworkerCTA;
