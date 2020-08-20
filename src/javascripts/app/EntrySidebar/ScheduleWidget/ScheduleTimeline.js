import React from 'react';
import { css } from 'emotion';
import { sortBy } from 'lodash';
import PropTypes from 'prop-types';
import { List } from '@contentful/forma-36-react-components';
import ScheduledAction from 'app/ScheduledActions/EntrySidebarWidget/ScheduledActionsTimeline/ScheduledAction';
import { Divider } from 'app/ScheduledActions/EntrySidebarWidget/ScheduledActionsTimeline/Divider';

const styles = {
  list: css({
    maxHeight: '240px',
    overflow: 'auto',
  }),
  cursorPointer: css({
    cursor: 'pointer',
  }),
};

const ScheduleTimeline = ({
  onScheduledActionCancel,
  readOnlyScheduledActions,
  pendingScheduledActions,
  isMasterEnvironment,
}) => {
  const pendingEntityScheduledActions = [];
  const pendingReleaseScheduledActions = [];

  for (const pendingScheduledAction of pendingScheduledActions) {
    if (pendingScheduledAction.entity.sys.linkType === 'Release') {
      pendingReleaseScheduledActions.push(pendingScheduledAction);
    } else {
      pendingEntityScheduledActions.push(pendingScheduledAction);
    }
  }

  if (!pendingEntityScheduledActions.length) {
    return null;
  }

  const renderScheduledEntityCard = (scheduledEntityAction, index) => {
    const nextScheduledEntityAction = pendingEntityScheduledActions[index + 1];

    return (
      <li key={scheduledEntityAction.sys.id} data-test-id="scheduled-action-list-item">
        <ScheduledAction
          scheduledAction={scheduledEntityAction}
          onCancel={onScheduledActionCancel}
          isMasterEnvironment={isMasterEnvironment}
          showLinkToSchedulesView={true}
          // will be true if commands.primary.isDisabled(). See EntitySidebarBridge
          isReadOnly={readOnlyScheduledActions}
          size="default"
          linkType={scheduledEntityAction.entity.sys.linkType}
        />
        <Divider currentJob={scheduledEntityAction} nextJob={nextScheduledEntityAction} />
      </li>
    );
  };

  return (
    <List testId="schedules-timeline" className={styles.list}>
      {sortBy(pendingEntityScheduledActions, 'scheduledFor.datetime').map(
        renderScheduledEntityCard
      )}
    </List>
  );
};

ScheduleTimeline.propTypes = {
  onScheduledActionCancel: PropTypes.func,
  readOnlyScheduledActions: PropTypes.bool,
  pendingScheduledActions: PropTypes.arrayOf(PropTypes.object).isRequired,
  isMasterEnvironment: PropTypes.bool,
};

export { ScheduleTimeline };
