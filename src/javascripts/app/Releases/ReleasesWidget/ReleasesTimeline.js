import React, { Component } from 'react';
import { css } from 'emotion';
import PropTypes from 'prop-types';
import { List } from '@contentful/forma-36-react-components';
import Release from './Release';

const styles = {
  list: css({
    maxHeight: '120px',
    overflow: 'auto',
  }),
  cursorPointer: css({
    cursor: 'pointer',
  }),
};

export default class ReleasesTimeline extends Component {
  static propTypes = {
    releases: PropTypes.array,
    onReleaseSelect: PropTypes.func,
    deleteEntityFromRelease: PropTypes.func,
  };

  handleClick(release) {
    if (this.props.onReleaseSelect) {
      this.props.onReleaseSelect(release);
    }
  }

  render() {
    return (
      <List className={styles.list}>
        {this.props.releases.map((release, index) => (
          <li
            key={`release-${index}`}
            onClick={this.props.onReleaseSelect ? () => this.handleClick(release) : null}
            className={this.props.onReleaseSelect && styles.cursorPointer}>
            <Release
              release={release}
              deleteEntityFromRelease={this.props.deleteEntityFromRelease}
              shouldCardHandleClick={!this.props.onReleaseSelect}
            />
          </li>
        ))}
      </List>
    );
  }
}
