import React from 'react';
import PropTypes from 'prop-types';
import { Icon, TableCell, Tooltip } from '@contentful/forma-36-react-components';
import { cx, css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import ContactUsButton from 'ui/Components/ContactUsButton';
import { track } from 'analytics/Analytics';

const styles = {
  icon: css({
    marginTop: `-${tokens.spacing2Xs}`,
    verticalAlign: 'middle',
  }),
  usageWarning: css({
    color: tokens.colorWarning,
  }),
  usageNegative: css({
    color: tokens.colorNegative,
  }),
  usageEmphasized: css({
    fontWeight: tokens.fontWeightDemiBold,
  }),
};

const trackClickEvent = (eventName) => () => {
  track(`space_usage_summary:${eventName}`);
};

export const SpaceUsageTableCell = ({ usage, limit, testId }) => {
  const percentage = Math.round((usage / limit) * 100);
  const lowLimitResource = limit < 5 && limit - usage === 1;
  const approachingLimit = percentage >= 80 || lowLimitResource;
  let label;
  let icon;

  if (percentage > 100) {
    label = `Exceeding limit (${percentage}%)`;
    icon = {
      color: 'negative',
      icon: 'InfoCircle',
    };
  } else if (approachingLimit) {
    icon = {
      color: 'warning',
      icon: 'Warning',
    };
    label = percentage === 100 ? 'Reached limit (100%)' : `Approaching limit (${percentage}%)`;
  }

  return (
    <TableCell
      testId={testId ?? 'subscription-page.spaces-list.usage'}
      className={cx({
        [styles.usageNegative]: icon?.color === 'negative',
        [styles.usageWarning]: icon?.color === 'warning',
      })}>
      {approachingLimit && (
        <Tooltip
          content={
            <div>
              {label}
              <br />
              <ContactUsButton noIcon isLink onClick={trackClickEvent('get_in_touch_clicked')}>
                Get in touch
              </ContactUsButton>{' '}
              to upgrade
            </div>
          }
          closeOnMouseLeave={false}
          onMouseOver={trackClickEvent('usage_tooltip_hovered')}
          testId="subscription-page.spaces-list.usage-tooltip">
          <Icon
            className={styles.icon}
            {...icon}
            testId="subscription-page.spaces-list.usage-tooltip-trigger"
          />
        </Tooltip>
      )}{' '}
      <span className={cx({ [styles.usageEmphasized]: approachingLimit })}>{usage}</span>/{limit}
    </TableCell>
  );
};

SpaceUsageTableCell.propTypes = {
  limit: PropTypes.number.isRequired,
  usage: PropTypes.number.isRequired,
  testId: PropTypes.string,
};
