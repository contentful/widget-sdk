import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { CheckboxField } from '@contentful/forma-36-react-components';
import constants from './constants.es6';

ReferenceField.propTypes = {
  id: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  contentType: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired
};

export default function ReferenceField({ id, checked, contentType, onSelect }) {
  const field = findFieldById(id, contentType);
  const disabled = !hasFieldLinkValidations(field);

  return (
    <div>
      <CheckboxField
        id={`reference-field-${id}`}
        checked={checked || !hasFieldLinkValidations(field)}
        disabled={disabled}
        onChange={e => onSelect({ id, checked: e.target.checked })}
        labelText={field.name}
        labelIsLight={true}
      />
    </div>
  );
}

function findFieldById(id, contentType) {
  return contentType.fields.find(field => field.id === id);
}

export function getFieldLinkValidations(field) {
  return get(field, ['items', 'validations'], field.validations).filter(v => v.linkContentType);
}

export function getNonFieldLinkValidations(field) {
  return get(field, ['items', 'validations'], field.validations).filter(v => !v.linkContentType);
}

export function hasFieldLinkValidations(field) {
  return getFieldLinkValidations(field).length > 0;
}

export function hasVariationContainerInFieldLinkValidations(field) {
  if (!hasFieldLinkValidations(field)) return false;

  let linkContentTypeValidations = getFieldLinkValidations(field)[0].linkContentType;
  if (typeof linkContentTypeValidations === 'string') {
    linkContentTypeValidations = [linkContentTypeValidations];
  }

  if (!Array.isArray(linkContentTypeValidations)) {
    linkContentTypeValidations = [];
  }

  return linkContentTypeValidations.includes(constants.VARIATION_CONTAINER_CT_ID);
}
