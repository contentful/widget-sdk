/* global requestAnimationFrame */
import { cloneDeep } from 'lodash';

import { h } from 'ui/Framework';
import keycodes from 'utils/keycodes';
import entitySelector from 'entitySelector';

export default function filterValueReference({
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

  return h('input.input-reset.search__input-text.search__input-reference', {
    dataTestId: testId,
    value,
    ref: inputRef,
    onClick: event => {
      event.stopPropagation();
      event.preventDefault();
      openSelector();
    },
    onChange: e => onChange(e.target.value),
    onKeyDown: e => handleKeyDown(e),
    tabIndex: '0',
    placeholder: 'Click to select'
  });
}

function shouldOpenSelector({ keyCode }) {
  return keyCode === keycodes.DOWN || keyCode === keycodes.ENTER || keyCode === keycodes.SPACE;
}
