import React from 'react';
import PropTypes from 'prop-types';
import { Note, Paragraph } from '@contentful/forma-36-react-components';
import { css } from 'emotion';

import tokens from '@contentful/forma-36-tokens';

export default function ReachedRolesLimitNote(props) {
  return (
    <Note noteType="warning" className={css({ marginBottom: tokens.spacingL })}>
      <Paragraph>
        You have reached the role limit for this{' '}
        {props.isLegacyOrganization ? 'organization' : 'space'}.{' '}
        {props.canUpgradeOrganization ? (
          <React.Fragment>Upgrade to add more roles</React.Fragment>
        ) : (
          <React.Fragment>
            {props.isLegacyOrganization
              ? 'Contact the admin of this organization to upgrade the organization'
              : 'Contact the admin of this space to upgrade the space'}
          </React.Fragment>
        )}
        {props.limit > 1 ? ' or delete an existing role.' : '.'}
      </Paragraph>
    </Note>
  );
}

ReachedRolesLimitNote.propTypes = {
  isLegacyOrganization: PropTypes.bool.isRequired,
  canUpgradeOrganization: PropTypes.bool.isRequired,
  limit: PropTypes.number.isRequired
};
