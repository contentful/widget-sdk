import React, { memo, useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { EntryCard, Icon } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import SheduleTooltip from 'app/ScheduledActions/EntrySidebarWidget/ScheduledActionsTimeline/ScheduleTooltip';
import { css } from 'emotion';
import WidgetApiContext from 'app/widgets/WidgetApi/WidgetApiContext';

import Thumbnail from './Thumbnail';
import { EntryActions, AssetActions } from './CardActions';

const styles = {
  marginRightXS: css({
    marginRight: tokens.spacing2Xs
  })
};

const IconWrappedIntoScheduledTooltip = memo(({ referencedEntityId }) => {
  const { widgetAPI } = useContext(WidgetApiContext);

  if (typeof _.get(widgetAPI, 'jobs.getPendingJobs') !== 'function') {
    return null;
  }

  const jobs = widgetAPI.jobs
    .getPendingJobs()
    .filter(job => job.entity.sys.id === referencedEntityId);
  const sortedJobs = _.orderBy(jobs, ['scheduledFor.datetime'], ['asc']);

  return (
    <SheduleTooltip job={sortedJobs[0]} jobsCount={sortedJobs.length}>
      <Icon icon="Clock" className={styles.marginRightXS} size="small" color="muted" />
    </SheduleTooltip>
  );
});

IconWrappedIntoScheduledTooltip.propTypes = {
  referencedEntityId: PropTypes.string
};

export { IconWrappedIntoScheduledTooltip };

/**
 * Wrapper around Forma 36 EntryCard. Can be used with entries but works
 * also with assets (as in the link editor's "Link" appearance style).
 */
export default class WrappedEntityCard extends React.Component {
  static propTypes = {
    entity: PropTypes.shape({
      sys: PropTypes.shape({
        id: PropTypes.string.isRequired
      })
    }),
    entityType: PropTypes.string,
    contentTypeName: PropTypes.string,
    entityDescription: PropTypes.string,
    entityFile: PropTypes.object,
    entityTitle: PropTypes.string,
    entityStatus: PropTypes.string,
    href: PropTypes.string,
    isLoading: PropTypes.bool,
    className: PropTypes.string,
    size: PropTypes.string,
    disabled: PropTypes.bool,
    selected: PropTypes.bool,
    onEdit: PropTypes.func,
    onRemove: PropTypes.func,
    onClick: PropTypes.func,
    readOnly: PropTypes.bool,
    cardDragHandleComponent: PropTypes.element
  };

  static defaultProps = {
    className: ''
  };

  renderActions = () => {
    if (this.props.readOnly) {
      return null;
    }
    const { entityType, disabled: isDisabled, onEdit, onRemove, entityFile } = this.props;
    const actions =
      entityType === 'Asset'
        ? new AssetActions({ isDisabled, onEdit, onRemove, entityFile })
        : new EntryActions({ isDisabled, onEdit, onRemove });
    // Can't just use jsx <EntryActions /> here as dropdownListElements expects
    // a React.Fragment with direct <DropdownList /> children.
    return actions.render();
  };

  render() {
    const {
      entityType,
      contentTypeName,
      entityDescription,
      entityFile,
      entityTitle,
      className,
      size,
      selected,
      entityStatus,
      isLoading,
      onClick,
      href,
      cardDragHandleComponent,
      entity
    } = this.props;

    return (
      <EntryCard
        title={entityTitle || 'Untitled'}
        contentType={contentTypeName || (entityType === 'Asset' ? 'Asset' : null)}
        className={className}
        href={href}
        target={href ? '_blank' : undefined}
        rel={href ? 'noopener' : undefined}
        description={entityDescription}
        size={size}
        selected={selected}
        status={entityStatus}
        statusIcon={
          <IconWrappedIntoScheduledTooltip
            referencedEntityId={_.get(entity, 'sys.id', undefined)}
          />
        }
        thumbnailElement={entityFile && <Thumbnail thumbnail={entityFile} />}
        loading={isLoading}
        dropdownListElements={this.renderActions()}
        onClick={onClick}
        cardDragHandleComponent={cardDragHandleComponent}
        withDragHandle={!!cardDragHandleComponent}
      />
    );
  }
}
