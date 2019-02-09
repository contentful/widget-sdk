import React, { Component } from 'react';
import { css } from 'react-emotion';
import tokens from '@contentful/forma-36-tokens';
import { Heading } from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';

const styles = {
  list: css`
    margin-bottom: ${tokens.spacing3Xl};
    position: relative;
    z-index: 1;
  `,
  overlay: css`
    position: absolute;
    z-index: 2;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: white;
    opacity: 0.8;
  `
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
