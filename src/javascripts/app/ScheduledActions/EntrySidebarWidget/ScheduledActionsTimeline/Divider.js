import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

const styles = {
  divider: css({
    height: 20,
    marginBottom: tokens.spacingXs,
    position: 'relative',
    background: '#f7f9fa',
    textAlign: 'center',
    ':before': {
      top: 9,
      content: '""',
      left: 0,
      position: 'absolute',
      width: '100%',
      height: '1px',
      background: tokens.colorTextLightest,
    },
  }),
  dividerDate: css({
    left: 0,
    padding: '0px 5px',
    color: tokens.colorTextLight,
    background: '#f7f9fa',
    position: 'absolute',
    marginLeft: '50%',
    transform: 'translateX(-50%)',
  }),
};

const Divider = ({ currentJob, nextJob }) => {
  if (!nextJob) {
    return null;
  }

  const formatDate = (curDate, nextDate) => {
    const dayDifference = moment(curDate)
      .startOf('day')
      .diff(moment(nextDate).startOf('day'), 'days');

    if (dayDifference === 0) {
      return null;
    } else if (dayDifference === -1) {
      return `1 Day`;
    } else {
      return `${-dayDifference} Days`;
    }
  };

  const formattedDate = formatDate(currentJob.scheduledFor.datetime, nextJob.scheduledFor.datetime);

  if (!formattedDate) {
    return null;
  }

  return (
    <div className={styles.divider}>
      <span className={styles.dividerDate}>
        {formatDate(currentJob.scheduledFor.datetime, nextJob.scheduledFor.datetime)}
      </span>
    </div>
  );
};

Divider.propTypes = {
  currentJob: PropTypes.shape({
    scheduledFor: PropTypes.shape({
      datetime: PropTypes.string,
    }),
  }),
  nextJob: PropTypes.shape({
    scheduledFor: PropTypes.shape({
      datetime: PropTypes.string,
    }),
  }),
};

export { Divider };
