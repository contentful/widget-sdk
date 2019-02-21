import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import TagEditor from './TagEditor.es6';

function getConstraintsType(sizeConstraints) {
  if (_.isNumber(sizeConstraints.min) && _.isNumber(sizeConstraints.max)) {
    return 'min-max';
  } else if (_.isNumber(sizeConstraints.min)) {
    return 'min';
  } else if (_.isNumber(sizeConstraints.max)) {
    return 'max';
  } else {
    return null;
  }
}

export default function TagEditorField({ field }) {
  const [items, setItems] = useState([]);
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    return field.onIsDisabledChanged(isDisabled => {
      setIsDisabled(isDisabled);
    });
  }, []);

  useEffect(() => {
    return field.onValueChanged(items => {
      items = items || [];
      // We make a copy so we do not modify the object in the
      // snapshot.
      setItems([...items]);
    });
  }, []);

  const constraints =
    _(field.validations)
      .map('size')
      .filter()
      .first() || {};

  const constraintsType = getConstraintsType(constraints);

  return (
    <TagEditor
      constraints={constraints}
      constraintsType={constraintsType}
      isDisabled={isDisabled}
      items={items}
      onAdd={value => {
        field.pushValue(value);
      }}
      onRemove={index => {
        field.removeValueAt(index);
      }}
      onRemoveLast={() => {
        field.removeValue();
      }}
    />
  );
}

TagEditorField.propTypes = {
  field: PropTypes.object.isRequired
};
