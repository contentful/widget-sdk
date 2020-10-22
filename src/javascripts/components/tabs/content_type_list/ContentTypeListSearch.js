import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { TextInput } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  input: css({
    width: '100%',
    maxWidth: '985px', // To match content list search width
    marginRight: tokens.spacingM,
  }),
};

export default class ContentTypeListSearch extends React.Component {
  static propTypes = {
    searchTerm: PropTypes.string,
    onChange: PropTypes.func,
  };
  handleChange = (e) => {
    const value = e.target.value;
    this.props.onChange(value);
  };
  render() {
    return (
      <TextInput
        testId="search-box"
        autoFocus
        placeholder="Search for a content type"
        value={this.props.searchTerm}
        onChange={this.handleChange}
        width="large"
        className={styles.input}
      />
    );
  }
}
