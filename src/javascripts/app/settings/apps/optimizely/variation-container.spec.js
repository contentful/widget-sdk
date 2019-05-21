'use strict';

import { addValidationToReferenceField, updateReferenceField } from './variation-container.es6';
import constants from './constants.es6';

describe('addValidationToReferenceField', () => {
  it('adds container validation to given field with multiple references', () => {
    const field = { items: { validations: [] } };
    addValidationToReferenceField(field);

    expect(field.items.validations).toHaveLength(1);
    expect(field.items.validations[0].linkContentType).toHaveLength(1);
    expect(field.items.validations[0].linkContentType[0]).toEqual(
      constants.VARIATION_CONTAINER_CT_ID
    );
  });

  it('adds container validation to given field with multiple references and existing validations', () => {
    const field = { items: { validations: ['span', 'eggs', { linkContentType: ['foobar'] }] } };
    addValidationToReferenceField(field);

    expect(field.items.validations).toHaveLength(3);
    expect(field.items.validations[2].linkContentType).toHaveLength(2);
    expect(field.items.validations[2].linkContentType[1]).toEqual(
      constants.VARIATION_CONTAINER_CT_ID
    );
  });

  it('adds container validation to given field with existing link content type validation', () => {
    const field = { items: { validations: ['span', 'eggs', { linkContentType: ['foobar'] }] } };
    addValidationToReferenceField(field);

    expect(field.items.validations).toHaveLength(3);
    expect(field.items.validations[2].linkContentType).toHaveLength(2);
    expect(field.items.validations[2].linkContentType[1]).toEqual(
      constants.VARIATION_CONTAINER_CT_ID
    );
  });
});

describe('updateReferenceField', () => {
  it('adds container validation to a checked field without container validation', () => {
    const field = { id: '314', items: { validations: [] } };
    updateReferenceField(field, {
      314: true
    });

    expect(field.items.validations).toHaveLength(1);
    expect(field.items.validations[0].linkContentType).toHaveLength(1);
    expect(field.items.validations[0].linkContentType[0]).toEqual(
      constants.VARIATION_CONTAINER_CT_ID
    );
  });

  it('should not add validation if there is already container in the validation', () => {
    const field = {
      id: '314',
      items: {
        validations: [
          'span',
          'eggs',
          { linkContentType: ['foobar', constants.VARIATION_CONTAINER_CT_ID, 'eggs'] }
        ]
      }
    };

    updateReferenceField(field, {
      314: true
    });

    expect(field.items.validations).toHaveLength(3);
    expect(field.items.validations[2].linkContentType).toHaveLength(3);
    expect(field.items.validations[2].linkContentType[1]).toEqual(
      constants.VARIATION_CONTAINER_CT_ID
    );
  });

  it('should remove container validation if it got unchecked', () => {
    const field = {
      id: '314',
      items: {
        validations: [
          'span',
          'eggs',
          { linkContentType: ['foobar', constants.VARIATION_CONTAINER_CT_ID, 'eggs'] }
        ]
      }
    };

    updateReferenceField(field, {
      314: false
    });

    expect(field.items.validations).toHaveLength(3);
    expect(field.items.validations[2].linkContentType).toHaveLength(2);
    expect(field.items.validations[2].linkContentType[0]).toEqual('foobar');
    expect(field.items.validations[2].linkContentType[1]).toEqual('eggs');
  });
});
