import React from 'react';
import PropTypes from 'prop-types';
import {
  InlineEntryCard,
  DropdownListItem,
  DropdownList,
  Icon
} from '@contentful/forma-36-react-components';
import { ScheduleTooltip } from 'app/ScheduledActions';

import { default as FetchEntity, RequestStatus } from 'app/widgets/shared/FetchEntity';
import { INLINES } from '@contentful/rich-text-types';
import { filterRelevantJobsForEntity, sortJobsByRelevance } from 'app/ScheduledActions/utils';
import { inlineEmbedStyles as styles } from './styles';

export default class EntryInlineEmbed extends React.Component {
  static propTypes = {
    widgetAPI: PropTypes.object.isRequired,
    entryId: PropTypes.string.isRequired,
    isSelected: PropTypes.bool.isRequired,
    isDisabled: PropTypes.bool.isRequired,
    isReadOnly: PropTypes.bool.isRequired,
    onRemove: PropTypes.func,
    onOpenEntity: PropTypes.func,
    onEntityFetchComplete: PropTypes.func
  };

  renderMissingNode() {
    const { isSelected } = this.props;
    return (
      <InlineEntryCard testId={INLINES.EMBEDDED_ENTRY} selected={isSelected}>
        Entry missing or inaccessible
      </InlineEntryCard>
    );
  }

  renderNode(
    { requestStatus, contentTypeName, entity, entityTitle, entityStatus },
    { job, jobsCount }
  ) {
    const isLoading = requestStatus === RequestStatus.Pending && !entity;
    return (
      <InlineEntryCard
        testId={INLINES.EMBEDDED_ENTRY}
        selected={this.props.isSelected}
        title={`${contentTypeName}: ${entityTitle}`}
        status={entityStatus}
        isLoading={isLoading}
        dropdownListElements={
          !this.props.isReadOnly ? (
            <DropdownList>
              <DropdownListItem onClick={() => this.props.onOpenEntity(entity)}>
                Edit
              </DropdownListItem>
              <DropdownListItem onClick={this.props.onRemove} isDisabled={this.props.isDisabled}>
                Remove
              </DropdownListItem>
            </DropdownList>
          ) : null
        }>
        {job && (
          <ScheduleTooltip job={job} jobsCount={jobsCount}>
            <Icon
              className={styles.scheduledIcon}
              icon="Clock"
              color="muted"
              testId="scheduled-icon"
            />
          </ScheduleTooltip>
        )}
        {entityTitle || 'Untitled'}
      </InlineEntryCard>
    );
  }

  render() {
    const { entryId, onEntityFetchComplete, widgetAPI } = this.props;
    return (
      <FetchEntity
        widgetAPI={widgetAPI}
        entityId={entryId}
        entityType="Entry"
        localeCode={widgetAPI.field.locale}
        render={fetchEntityResult => {
          if (fetchEntityResult.requestStatus !== RequestStatus.Pending) {
            onEntityFetchComplete && onEntityFetchComplete();
          }
          if (fetchEntityResult.requestStatus === RequestStatus.Error) {
            return this.renderMissingNode();
          } else {
            const jobs = widgetAPI.jobs ? widgetAPI.jobs.getPendingJobs() : [];
            const relevantJobs = filterRelevantJobsForEntity(jobs, 'Entry', entryId);
            const mostRelevantJob = sortJobsByRelevance(relevantJobs)[0];
            const scheduledInfo = {
              job: mostRelevantJob,
              jobsCount: relevantJobs.length
            };
            return this.renderNode(fetchEntityResult, scheduledInfo);
          }
        }}
      />
    );
  }
}
