import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ReferenceCard, Card, IconButton, Spinner } from '@contentful/ui-component-library';

import FetchEntry from './FetchEntry';
import { goToSlideInEntity } from 'states/EntityNavigationHelpers';
import { isValidImage, getExternalImageUrl } from 'ui/cf/thumbnailHelpers';

const thumbnailDimensions = {w: 70, h: 70};

const ThumbnailSpinner = () =>
  <div
    style={{
      height: `${thumbnailDimensions.h}px`,
      width: `${thumbnailDimensions.w}px`,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}
  >
    <Spinner />
  </div>;

class Thumbnail extends Component {
  static propTypes = {
    entryThumbnail: PropTypes.shape({
      url: PropTypes.string,
      contentType: PropTypes.string
    }),
    loading: PropTypes.bool.isRequired
  }

  static defaulProps = {
    entryThumbnail: undefined
  }

  constructor (props) {
    super(props);
    this.state = { finishedLoading: false };
  }

  handleImageLoaded () {
    this.setState({ finishedLoading: true });
  }

  render () {
    return (
      <React.Fragment>
        {
          (this.props.loading || !this.state.finishedLoading) && <ThumbnailSpinner />
        }
        {
          (this.props.entryThumbnail && isValidImage(this.props.entryThumbnail.contentType)) &&
            <img
              src={`${getExternalImageUrl(this.props.entryThumbnail.url)}?w=${thumbnailDimensions.w}&h=${thumbnailDimensions.h}&fit=thumb`}
              height={`${thumbnailDimensions.h}`}
              width={`${thumbnailDimensions.w}`}
              onLoad={this.handleImageLoaded.bind(this)}
            />
        }
      </React.Fragment>
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
          entryIsMissing,
          loading
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
              <ReferenceCard
                title={entryTitle}
                contentType={entry.sys.contentType.sys.id}
                description={entryDescription}
                selected={isSelected}
                status={entryStatus}
                thumbnailElement={<Thumbnail {...{entryThumbnail, loading: loading.thumbnail}} />}
                loading={loading.entry}
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
            );
          }
        }}
      />
    );
  }
}
