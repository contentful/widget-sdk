import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ReferenceCard, Card, IconButton } from '@contentful/ui-component-library';

import FetchEntry from './FetchEntry';
import { goToSlideInEntity } from 'states/EntityNavigationHelpers';
import { isValidImage, getExternalImageUrl } from 'ui/cf/thumbnailHelpers';

const thumbnailDimensions = {w: 70, h: 70};

class Thumbnail extends Component {
  static propTypes = {
    entryThumbnail: PropTypes.shape({
      url: PropTypes.string,
      contentType: PropTypes.string
    })
  };

  static defaultProps = {
    entryThumbnail: undefined
  };

  render () {
    const valid = this.props.entryThumbnail && isValidImage(this.props.entryThumbnail.contentType);
    if (!valid) return null;
    return (
        <img
          src={`${getExternalImageUrl(this.props.entryThumbnail.url)}?w=${thumbnailDimensions.w}&h=${thumbnailDimensions.h}&fit=thumb`}
          height={`${thumbnailDimensions.h}`}
          width={`${thumbnailDimensions.w}`}
        />
    );
  }
}

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

  render () {
    const { node } = this.props;

    return (
      <FetchEntry
        node={node}
        render={(fetchEntryResult) => {
          if (fetchEntryResult.entryIsMissing) {
            return this.renderMissingEntryReferenceCard();
          } else {
            return this.renderReferenceCard(fetchEntryResult);
          }
        }}
      />
    );
  }

  renderReferenceCard ({
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
        title={entryTitle}
        contentType={entry.sys.contentType.sys.id}
        description={entryDescription}
        selected={isSelected}
        status={entryStatus}
        thumbnailElement={<Thumbnail entryThumbnail={entryThumbnail} />}
        loading={loading.entry || loading.thumbnail}
        actionElements={
          <React.Fragment>
            <IconButton
              iconProps={{ icon: 'Edit' }}
              label='Edit entry'
              onClick={event => this.handleEditClick(event, entry)}
              buttonType='muted'
            />
            {this.renderDeleteButton()}
          </React.Fragment>
        }
      />
    );
  }

  renderMissingEntryReferenceCard () {
    const { isSelected } = this.props;

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
          {this.renderDeleteButton()}
        </div>
      </Card>
    );
  }

  renderDeleteButton () {
    const isDisabled = this.props.editor.props.readOnly;

    return (
      <IconButton
        iconProps={{ icon: 'Close' }}
        label='Remove reference to entry'
        onClick={event => this.handleRemoveClick(event)}
        buttonType='muted'
        disabled={isDisabled}
      />
    );
  }
}
