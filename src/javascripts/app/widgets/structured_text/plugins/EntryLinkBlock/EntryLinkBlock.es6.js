import React from 'react';
import PropTypes from 'prop-types';
import { ReferenceCard, Card, IconButton } from '@contentful/ui-component-library';

import FetchEntry from './FetchEntry';
import Thumbnail from './Thumbnail';
// TODO: move closer to the widgetAPI
import { goToSlideInEntity } from 'navigation/SlideInNavigator';
import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext';

export default class LinkedEntryBlock extends React.Component {
  static propTypes = {
    isSelected: PropTypes.bool.isRequired,
    attributes: PropTypes.object.isRequired,
    editor: PropTypes.object.isRequired,
    node: PropTypes.object.isRequired
  };

  handleEditClick = (event, entry) => {
    event.stopPropagation();
    goToSlideInEntity(
      {
        id: entry.sys.id,
        type: 'Entry'
      },
      2
    );
  };

  handleRemoveClick = event => {
    event.stopPropagation();
    const { editor, node } = this.props;
    editor.change(change => change.removeNodeByKey(node.key));
  };

  renderReferenceCard({
    entry,
    entryTitle,
    entryDescription,
    entryThumbnail,
    entryStatus,
    loading
  }) {
    const { isSelected } = this.props;

    return (
      <ReferenceCard
        {...this.props.attributes}
        title={entryTitle}
        contentType={entry.sys.contentType.sys.id}
        extraClassNames="structured-text__reference-card"
        description={entryDescription}
        selected={isSelected}
        status={entryStatus}
        thumbnailElement={<Thumbnail entryThumbnail={entryThumbnail} />}
        loading={loading.entry || loading.thumbnail}
        actionElements={
          <React.Fragment>
            <IconButton
              iconProps={{ icon: 'Edit' }}
              label="Edit entry"
              onClick={event => this.handleEditClick(event, entry)}
              buttonType="muted"
              testId="edit"
            />
            {this.renderDeleteButton()}
          </React.Fragment>
        }
      />
    );
  }

  renderMissingEntryReferenceCard() {
    const { isSelected } = this.props;

    return (
      <Card selected={isSelected}>
        <div style={{ display: 'flex' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '.875rem', // Equal to 14px when browser text size is set to 100%
              lineHeight: 1.5,
              flex: '1 1 0'
            }}>
            Entity missing or inaccessible
          </h1>
          {this.renderDeleteButton()}
        </div>
      </Card>
    );
  }

  renderDeleteButton() {
    const isDisabled = this.props.editor.props.readOnly;

    return (
      <IconButton
        iconProps={{ icon: 'Close' }}
        label="Remove reference to entry"
        onClick={event => this.handleRemoveClick(event)}
        buttonType="muted"
        disabled={isDisabled}
        testId="delete"
      />
    );
  }

  render() {
    const { node } = this.props;

    return (
      <WidgetAPIContext.Consumer>
        {({ widgetAPI }) => (
          <FetchEntry
            node={node}
            currentUrl={widgetAPI.currentUrl}
            render={fetchEntryResult => {
              if (fetchEntryResult.entryIsMissing) {
                return this.renderMissingEntryReferenceCard();
              } else {
                return this.renderReferenceCard(fetchEntryResult);
              }
            }}
          />
        )}
      </WidgetAPIContext.Consumer>
    );
  }
}
