import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import debounce from 'lodash/debounce';
import { TextInput } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  input: css({
    width: '100%',
    maxWidth: '985px', // To match content list search width
    marginRight: tokens.spacingM
  })
};

export default class ContentTypeListSearch extends React.Component {
  static propTypes = {
    initialValue: PropTypes.string,
    onChange: PropTypes.func
  };
  state = {
    value: this.props.initialValue
  };
  debouncedOnChangeCallback = debounce(value => {
    this.props.onChange(value);
  }, 200);
  handleChange = e => {
    const value = e.target.value;
    this.setState({
      value
    });
    this.debouncedOnChangeCallback(value);
  };
  render() {
    return (
      <TextInput
        testId="search-box"
        autoFocus
        placeholder="Search for a content type"
        value={this.state.value}
        onChange={this.handleChange}
        width="large"
        className={styles.input}
      />
    );
  }
}
