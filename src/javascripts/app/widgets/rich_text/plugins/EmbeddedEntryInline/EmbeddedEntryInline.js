import React from 'react';
import PropTypes from 'prop-types';
import {
  InlineEntryCard,
  DropdownListItem,
  DropdownList,
  Icon
} from '@contentful/forma-36-react-components';
import { orderBy, get } from 'lodash';

import { default as FetchEntity, RequestStatus } from 'app/widgets/shared/FetchEntity';
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext';
import { INLINES } from '@contentful/rich-text-types';
import ScheduleTooltip from 'app/ScheduledActions/EntrySidebarWidget/ScheduledActionsTimeline/ScheduleTooltip';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  scheduledIcon: css({
    verticalAlign: 'text-bottom',
    marginRight: tokens.spacing2Xs
  })
};

class EmbeddedEntryInline extends React.Component {
  handleEditClick = entry => {
    this.props.widgetAPI.navigator.openEntry(entry.sys.id, { slideIn: true });
  };

  handleRemoveClick = () => {
    const { editor, node } = this.props;
    editor.removeNodeByKey(node.key);
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
        className="rich-text__inline-reference-card"
        isLoading={isLoading}
        dropdownListElements={
          !this.props.editor.props.actionsDisabled ? (
            <DropdownList>
              <DropdownListItem onClick={() => this.handleEditClick(entity)}>Edit</DropdownListItem>
              <DropdownListItem
                onClick={this.handleRemoveClick}
                isDisabled={this.props.editor.props.readOnly}>
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
    const { onEntityFetchComplete } = this.props;
    const entryId = this.props.node.data.get('target').sys.id;

    return (
      <WidgetAPIContext.Consumer>
        {({ widgetAPI }) => (
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
                const scheduledInfo = {
                  job: undefined,
                  jobsCount: 0
                };
                if (typeof get(widgetAPI, 'jobs.getPendingJobs') === 'function') {
                  const jobs = widgetAPI.jobs
                    .getPendingJobs()
                    .filter(job => job.entity.sys.id === entryId);
                  const sortedJobs = orderBy(jobs, ['scheduledFor.datetime'], ['asc']);
                  scheduledInfo.job = sortedJobs[0];
                  scheduledInfo.jobsCount = sortedJobs.length;
                }
                return this.renderNode(fetchEntityResult, scheduledInfo);
              }
            }}
          />
        )}
      </WidgetAPIContext.Consumer>
    );
  }
}

EmbeddedEntryInline.propTypes = {
  widgetAPI: PropTypes.object.isRequired,
  isSelected: PropTypes.bool.isRequired,
  editor: PropTypes.object.isRequired,
  node: PropTypes.object.isRequired,
  onEntityFetchComplete: PropTypes.func
};

export default EmbeddedEntryInline;
