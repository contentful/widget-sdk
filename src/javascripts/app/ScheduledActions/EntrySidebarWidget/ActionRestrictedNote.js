import React from 'react';
import PropTypes from 'prop-types';
import { Icon, Paragraph } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  actionRestrictionNote: css({
    color: tokens.colorTextLight,
    marginTop: tokens.spacingXs,
  }),
};

export default function ActionRestrictedNote({ actionName, reason }) {
  return (
    <Paragraph className={styles.actionRestrictionNote} data-test-id="action-restriction-note">
      <Icon icon="Lock" color="muted" className="action-restricted__icon" />
      {reason ? reason : `You do not have permission to ${actionName.toLowerCase()}`}
    </Paragraph>
  );
}

ActionRestrictedNote.propTypes = {
  actionName: PropTypes.string,
  reason: PropTypes.string,
};
