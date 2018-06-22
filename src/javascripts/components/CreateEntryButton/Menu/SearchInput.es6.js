import _ from 'lodash';
import * as React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@contentful/ui-component-library';

export default function SearchInput ({ getInputProps }) {
  return (
    <div>
      <input
        {...getInputProps({ placeholder: 'Search all content types' })}
        id="addEntrySearchInput"
        autoFocus
        className="cfnext-form__input--full-size context-menu__search-input"
        data-test-id="addEntrySearchInput"
      />
      <label htmlFor="addEntrySearchInput">
        <Icon
          icon="Search"
          size="small"
          color="muted"
          extraClassNames="context-menu__search-input-icon"
        />
      </label>
    </div>
  );
}

SearchInput.propTypes = {
  getInputProps: PropTypes.func.isRequired
};
