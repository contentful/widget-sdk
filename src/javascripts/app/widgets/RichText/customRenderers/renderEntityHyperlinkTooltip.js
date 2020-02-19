import React from 'react';
import { entityHyperlinkTooltipStyles as styles } from './styles';
import { ScheduleTooltipContent } from 'app/ScheduledActions';
import { filterRelevantJobsForEntity, sortJobsByRelevance } from 'app/ScheduledActions/utils';
import { EntityStatusTag } from 'components/shared/EntityStatusTag';
import { default as FetchEntity, RequestStatus } from 'app/widgets/shared/FetchEntity';
import { truncate } from 'utils/StringUtils';

export default function renderEntityHyperlinkTooltip(richTextAPI, target) {
  const { widgetAPI, logViewportAction } = richTextAPI;
  const onEntityFetchComplete = () => logViewportAction('linkRendered', {});
  return (
    <FetchEntity
      widgetAPI={widgetAPI}
      entityId={target.sys.id}
      entityType={target.sys.linkType}
      localeCode={widgetAPI.field.locale}
      fetchFile={false}
      render={({ requestStatus, ...entityInfo }) => {
        if (requestStatus === RequestStatus.Pending) {
          return `Loading ${target.sys.linkType.toLowerCase()}...`;
        }
        onEntityFetchComplete && onEntityFetchComplete();
        let tooltip = '';
        if (requestStatus === RequestStatus.Error) {
          tooltip = `${target.sys.linkType} missing or inaccessible`;
        } else if (requestStatus === RequestStatus.Success) {
          tooltip = (
            <>
              {renderEntityInfo(entityInfo)}
              {renderScheduledJobs()}
            </>
          );
        }
        return tooltip;
      }}
    />
  );

  // eslint-disable-next-line react/prop-types
  function renderEntityInfo({ entityTitle, entityStatus, contentTypeName }) {
    const title = truncate(entityTitle, 60) || 'Untitled';
    return (
      <div>
        <span className={styles.entityContentType}>{contentTypeName || 'Asset'}</span>
        <span className={styles.entityTitle}>{title}</span>
        <EntityStatusTag statusLabel={entityStatus} />
      </div>
    );
  }

  function renderScheduledJobs() {
    if (!widgetAPI.jobs) {
      return null;
    }
    const { id: entityId, linkType: entityType } = target.sys;
    const jobs = widgetAPI.jobs.getPendingJobs();
    const relevantJobs = filterRelevantJobsForEntity(jobs, entityType, entityId);
    const mostRelevantJob = sortJobsByRelevance(relevantJobs)[0];
    return mostRelevantJob ? (
      <>
        <hr className={styles.separator} />
        <ScheduleTooltipContent job={mostRelevantJob} jobsCount={relevantJobs.length} />
      </>
    ) : null;
  }
}
