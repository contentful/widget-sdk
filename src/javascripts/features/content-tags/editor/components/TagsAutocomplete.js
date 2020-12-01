import React from 'react';
import Autocomplete from '@contentful/forma-36-react-components/dist/components/Autocomplete';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';

const styles = {
  Autocomplete: css({
    marginTop: tokens.spacingS,
    marginBottom: tokens.spacingM,
  }),
};

const TagsAutocomplete = ({ tags, isLoading, onChange, onQueryChange, disabled, style = {} }) => {
  return (
    <Autocomplete
      items={tags}
      width={'full'}
      onQueryChange={onQueryChange}
      onChange={onChange}
      isLoading={isLoading}
      placeholder={'search for tags'}
      emptyListMessage={'no tags found'}
      noMatchesMessage={'no matches'}
      dropdownProps={{ isFullWidth: true }}
      disabled={disabled}
      className={css(styles.Autocomplete, style)}>
      {(options) => options.map((option) => <span key={option.value}>{option.label}</span>)}
    </Autocomplete>
  );
};

TagsAutocomplete.propTypes = {
  tags: PropTypes.array,
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  onQueryChange: PropTypes.func,
  style: PropTypes.object,
};

export { TagsAutocomplete };