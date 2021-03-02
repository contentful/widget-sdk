import React from 'react';
import Autocomplete from '@contentful/forma-36-react-components/dist/components/Autocomplete';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import { TagVisibility } from 'features/content-tags/core/components/TagVisibility';

const styles = {
  Autocomplete: css({
    marginTop: tokens.spacingS,
    marginBottom: tokens.spacingM,
  }),
};

const TagsAutocomplete = ({ tags, isLoading, onSelect, onQueryChange, disabled, style = {} }) => {
  return (
    <Autocomplete
      items={tags}
      width={'full'}
      onQueryChange={onQueryChange}
      onChange={onSelect}
      isLoading={isLoading}
      placeholder={'search for tags'}
      emptyListMessage={'no tags found'}
      noMatchesMessage={'no matches'}
      dropdownProps={{ isFullWidth: true }}
      disabled={disabled}
      className={css(styles.Autocomplete, style)}>
      {(options) =>
        options.map((option) => {
          if (option.inlineCreation) {
            return (
              <span>
                <strong>{option.label}</strong> (create new)
              </span>
            );
          }
          return (
            <span key={option.value}>
              {option.label}
              <TagVisibility visibility={option.visibility} />
            </span>
          );
        })
      }
    </Autocomplete>
  );
};

TagsAutocomplete.propTypes = {
  tags: PropTypes.array,
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
  onSelect: PropTypes.func,
  onQueryChange: PropTypes.func,
  style: PropTypes.object,
};

export { TagsAutocomplete };
