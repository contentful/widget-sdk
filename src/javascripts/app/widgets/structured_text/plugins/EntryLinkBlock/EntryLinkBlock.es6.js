import React from 'react';
import PropTypes from 'prop-types';
import { ReferenceCard, Card, IconButton } from '@contentful/ui-component-library';

import FetchEntry from './FetchEntry';
import { goToSlideInEntity } from 'states/EntityNavigationHelpers';
import { isValidImage, getExternalImageUrl } from 'ui/cf/thumbnailHelpers';

export default class LinkedEntryBlock extends React.Component {
  static propTypes = {
    isSelected: PropTypes.bool.isRequired,
    attributes: PropTypes.object.isRequired,
    editor: PropTypes.object.isRequired,
    node: PropTypes.object.isRequired
  };

  renderEntryThumbnail = entryThumbnail => {
    if (!entryThumbnail) {
      return;
    }

    if (isValidImage(entryThumbnail.contentType)) {
      return (
        <img
          src={`${getExternalImageUrl(entryThumbnail.url)}?w=70&h=70&fit=thumb`}
          height='70'
          width='70'
        />
      );
    } else {
      return null;
    }
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

  render () {
    const { node, isSelected } = this.props;

    return (
      <FetchEntry
        node={node}
        render={({
          entry,
          entryTitle,
          entryDescription,
          entryThumbnail,
          entryStatus,
          entryIsMissing
        }) => {
          if (entryIsMissing) {
            return (
              <Card selected={isSelected}>
                <div style={{display: 'flex'}}>
                  <h1 style={{
                    margin: 0,
                    fontSize: '.875rem', // Equal to 14px when browser text size is set to 100%
                    lineHeight: 1.5,
                    flex: '1 1 0'
                  }}
                  >Entity missing or inaccessible</h1>
                  <IconButton
                    iconProps={{ icon: 'Close' }}
                    label='Remove reference to entry'
                    onClick={event => this.handleRemoveClick(event)}
                    buttonType='muted'
                  />
                </div>
              </Card>
            );
          } else {
            return (
              entry && (
                <ReferenceCard
                  title={entryTitle}
                  contentType={entry.sys.contentType.sys.id}
                  description={entryDescription}
                  selected={isSelected}
                  status={entryStatus}
                  thumbnailElement={this.renderEntryThumbnail(entryThumbnail)}
                  actionElements={
                    <React.Fragment>
                      <IconButton
                        iconProps={{ icon: 'Edit' }}
                        label='Edit entry'
                        onClick={event => this.handleEditClick(event, entry)}
                        buttonType='muted'
                      />
                      <IconButton
                        iconProps={{ icon: 'Close' }}
                        label='Remove reference to entry'
                        onClick={event => this.handleRemoveClick(event)}
                        buttonType='muted'
                      />
                    </React.Fragment>
                  }
                />
              )
            );
          }
        }}
      />
    );
  }
}
