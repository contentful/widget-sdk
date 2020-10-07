import React from 'react';
import { css } from 'emotion';
import PropTypes from 'prop-types';

import { Icon } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { formatPastDate } from 'features/apps';

const styles = {
  container: css({
    direction: 'rtl',
    float: 'right',
    position: 'relative',
  }),
  wrapper: css({
    backgroundColor: tokens.colorPurpleBase,
    color: tokens.colorWhite,
    direction: 'ltr',
    display: 'flex',
    marginRight: tokens.spacingM,
    marginTop: tokens.spacingM,
    padding: tokens.spacing2Xs,
    position: 'absolute',
    whiteSpace: 'nowrap',
  }),
  icon: css({
    marginRight: tokens.spacing2Xs,
  }),
};

const ReleasesCardBadge = ({ lastAction }) => {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper} data-test-id="release-action-badge">
        <Icon icon="Clock" color="white" className={styles.icon} />
        <div>{formatPastDate(lastAction.sys.createdAt)}</div>
      </div>
    </div>
  );
};

ReleasesCardBadge.propTypes = {
  lastAction: PropTypes.shape({
    sys: PropTypes.shape({
      createdAt: PropTypes.string,
    }),
  }).isRequired,
};

export default ReleasesCardBadge;
