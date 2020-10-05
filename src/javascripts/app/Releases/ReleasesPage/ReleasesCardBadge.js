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

const ReleasesCardBadge = ({ release }) => {
  // @todo fetch and display the action date
  // const releaseId = release.sys.id;
  // const releaseActionId = release.sys.lastAction.sys.id;

  return (
    <div className={styles.container}>
      <div className={styles.wrapper} data-test-id="release-action-badge">
        <Icon icon="Clock" color="white" className={styles.icon} />
        <div>{formatPastDate(release.sys.createdAt)}</div>
      </div>
    </div>
  );
};

ReleasesCardBadge.propTypes = {
  release: PropTypes.shape({
    sys: PropTypes.shape({
      id: PropTypes.string,
      createdAt: PropTypes.string,
      lastAction: PropTypes.shape({
        sys: PropTypes.shape({
          id: PropTypes.string,
        }),
      }),
    }),
  }),
};

export default ReleasesCardBadge;
