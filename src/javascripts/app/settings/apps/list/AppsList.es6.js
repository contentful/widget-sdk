import React, { Component } from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Heading } from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';

const styles = {
  list: css({
    marginBottom: tokens.spacing3Xl,
    position: 'relative',
    zIndex: 1
  }),
  overlay: css({
    position: 'absolute',
    zIndex: 2,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: tokens.colorWhite,
    opacity: 0.8
  })
};

export default class AppsList extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    children: PropTypes.node,
    overlayed: PropTypes.bool
  };

  render() {
    return (
      <div className={styles.list}>
        {this.props.overlayed && <div className={styles.overlay} />}
        <Heading>{this.props.title}</Heading>
        {this.props.children}
      </div>
    );
  }
}
