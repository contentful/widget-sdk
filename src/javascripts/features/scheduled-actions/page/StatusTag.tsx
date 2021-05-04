import { ScheduledActionProps } from 'contentful-management/types';
import React from 'react';
import { Icon } from '@contentful/forma-36-react-components';
import { Tag } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  statusTag: css({
    display: 'flex',
  }),
  statusTagIcon: css({
    marginRight: tokens.spacingXs,
  }),
};

type StatusTagProps = {
  scheduledAction: ScheduledActionProps;
};

function StatusTag({ scheduledAction }: StatusTagProps) {
  const typeByStatus = {
    failed: 'negative',
    succeeded: 'positive',
    scheduled: 'primary',
    canceled: 'secondary',
  };

  const getStatusLabel = () => {
    switch (scheduledAction.sys.status) {
      case 'failed':
        return `${scheduledAction.action} failed`;
      case 'succeeded':
        return `${scheduledAction.action}ed`;
      default:
        return scheduledAction.action;
    }
  };
  const StatusIcon = () => {
    switch (scheduledAction.sys.status) {
      case 'failed':
        return <Icon className={styles.statusTagIcon} icon="ErrorCircle" color="negative" />;
      case 'succeeded':
        return <Icon className={styles.statusTagIcon} icon="CheckCircle" color="positive" />;
      case 'canceled':
        return <Icon className={styles.statusTagIcon} icon="CheckCircle" color="secondary" />;
      default:
        return null;
    }
  };

  return (
    <Tag className={styles.statusTag} tagType={typeByStatus[scheduledAction.sys.status]}>
      {StatusIcon()}
      {getStatusLabel()}
    </Tag>
  );
}

export { StatusTag };
