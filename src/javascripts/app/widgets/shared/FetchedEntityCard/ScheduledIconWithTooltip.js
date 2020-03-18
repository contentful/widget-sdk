import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { ScheduleTooltip } from 'app/ScheduledActions';
import WidgetApiContext from 'app/widgets/WidgetApi/WidgetApiContext';

export const ScheduledIconWithTooltip = memo(({ entityType, entityId, children }) => {
  const { widgetAPI } = React.useContext(WidgetApiContext);
  const [status, setStatus] = React.useState({ type: 'loading' });

  React.useEffect(() => {
    if (widgetAPI && widgetAPI.space) {
      widgetAPI.space
        .getEntityScheduledActions(entityType, entityId)
        .then(data => {
          setStatus({ type: 'loaded', jobs: data });
        })
        .catch(e => {
          setStatus({ type: 'error', error: e });
        });
    }
  }, []); // eslint-disable-line

  if (status.type === 'loading' || status.type === 'error') {
    return null;
  }

  const jobs = status.jobs ? status.jobs : [];
  const mostRelevantJob = jobs[0];

  return (
    <ScheduleTooltip job={mostRelevantJob} jobsCount={jobs.length}>
      {children}
    </ScheduleTooltip>
  );
});

ScheduledIconWithTooltip.propTypes = {
  entityType: PropTypes.string.isRequired,
  entityId: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};
