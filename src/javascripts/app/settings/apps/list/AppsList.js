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
  })
};

export default class AppsList extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    children: PropTypes.node
  };

  render() {
    return (
      <div className={styles.list}>
        <Heading>{this.props.title}</Heading>
        {this.props.children}
      </div>
    );
  }
}
