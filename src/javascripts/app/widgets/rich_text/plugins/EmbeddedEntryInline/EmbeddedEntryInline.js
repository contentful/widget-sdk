import React from 'react';
import PropTypes from 'prop-types';
import {
  InlineEntryCard,
  DropdownListItem,
  DropdownList,
  Icon,
} from '@contentful/forma-36-react-components';

import { default as FetchEntity, RequestStatus } from 'app/widgets/shared/FetchEntity';
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext';
import { INLINES } from '@contentful/rich-text-types';
import { ScheduledIconWithTooltip } from 'app/widgets/shared/FetchedEntityCard/ScheduledIconWithTooltip';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  scheduledIcon: css({
    verticalAlign: 'text-bottom',
    marginRight: tokens.spacing2Xs,
  }),
};

class EmbeddedEntryInline extends React.Component {
  handleEditClick = (entry) => {
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

  renderNode({ requestStatus, contentTypeName, entity, entityTitle, entityStatus }, entityId) {
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
        <ScheduledIconWithTooltip entityType="Entry" entityId={entityId}>
          <Icon
            className={styles.scheduledIcon}
            icon="Clock"
            color="muted"
            testId="scheduled-icon"
          />
        </ScheduledIconWithTooltip>
        {entityTitle || 'Untitled'}
      </InlineEntryCard>
    );
  }

  render() {
    const { attributes, onEntityFetchComplete } = this.props;
    const entryId = this.props.node.data.get('target').sys.id;

    return (
      // TODO: WidgetAPIContext.Consumer here seems only necessary for .currentUrl updates so that
      //  the card updates after navigating to it and changing the title.
      <WidgetAPIContext.Consumer>
        {({ widgetAPI }) => (
          <span {...attributes}>
            <FetchEntity
              widgetAPI={widgetAPI}
              entityId={entryId}
              entityType="Entry"
              localeCode={widgetAPI.field.locale}
              render={(fetchEntityResult) => {
                if (fetchEntityResult.requestStatus !== RequestStatus.Pending) {
                  onEntityFetchComplete && onEntityFetchComplete();
                }
                if (fetchEntityResult.requestStatus === RequestStatus.Error) {
                  return this.renderMissingNode();
                } else {
                  return this.renderNode(fetchEntityResult, entryId);
                }
              }}
            />
          </span>
        )}
      </WidgetAPIContext.Consumer>
    );
  }
}

EmbeddedEntryInline.propTypes = {
  attributes: PropTypes.object,
  widgetAPI: PropTypes.object.isRequired,
  isSelected: PropTypes.bool.isRequired,
  editor: PropTypes.object.isRequired,
  node: PropTypes.object.isRequired,
  onEntityFetchComplete: PropTypes.func,
};

export default EmbeddedEntryInline;
