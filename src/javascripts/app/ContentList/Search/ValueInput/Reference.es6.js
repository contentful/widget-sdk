/* global requestAnimationFrame */
import { cloneDeep } from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import keycodes from 'utils/keycodes.es6';
import entitySelector from 'entitySelector';

export default function FilterValueReference({
  ctField = {},
  testId,
  value,
  inputRef,
  onChange,
  onKeyDown
}) {
  // We do not want to support field type arrays of references yet.
  const ctFieldClone = cloneDeep(ctField);
  ctFieldClone.type = 'Link';

  const openSelector = () =>
    entitySelector
      .openFromField(ctFieldClone)
      .then(entities => entities.map(e => e.sys.id).join(','))
      .then(onChange);

  const handleKeyDown = e => {
    if (shouldOpenSelector(e)) {
      e.stopPropagation();
      e.preventDefault();
      openSelector();
    } else {
      onKeyDown(e);
    }
  };

  return (
    <input
      data-test-id={testId}
      value={value}
      ref={inputRef}
      onClick={event => {
        event.stopPropagation();
        event.preventDefault();
        openSelector();
      }}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => handleKeyDown(e)}
      tabIndex="0"
      placeholder="Click to select"
      className="input-reset search__input-text search__input-reference"
    />
  );
}
FilterValueReference.propTypes = {
  ctField: PropTypes.object,
  testId: PropTypes.string,
  value: PropTypes.any,
  inputRef: PropTypes.any,
  onChange: PropTypes.func,
  onKeyDown: PropTypes.func
};

function shouldOpenSelector({ keyCode }) {
  return keyCode === keycodes.DOWN || keyCode === keycodes.ENTER || keyCode === keycodes.SPACE;
}
