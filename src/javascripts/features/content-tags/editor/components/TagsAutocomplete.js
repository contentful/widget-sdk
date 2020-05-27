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

const TagsAutocomplete = ({ tags, isLoading, onChange, onQueryChange }) => {
  return (
    <Autocomplete
      items={tags}
      width={'full'}
      onQueryChange={onQueryChange}
      onChange={onChange}
      isLoading={isLoading}
      placeholder={'search for tags'}
      emptyListMessage={'empty list message'}
      noMatchesMessage={'no matches'}
      dropdownProps={{ isFullWidth: true }}
      className={styles.Autocomplete}>
      {(options) => options.map((option) => <span key={option.value}>{option.label}</span>)}
    </Autocomplete>
  );
};

TagsAutocomplete.propTypes = {
  tags: PropTypes.array,
  isLoading: PropTypes.bool,
  onChange: PropTypes.func,
  onQueryChange: PropTypes.func,
};

export { TagsAutocomplete };
