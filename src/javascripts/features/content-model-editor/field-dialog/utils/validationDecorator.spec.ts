import { find } from 'lodash';
import type { ContentFields, ContentTypeFieldValidation } from 'contentful-management/types';
import { decorateFieldValidations } from './validationDecorator';

const FIELD: ContentFields = {
  id: 'someFieldId',
  name: 'Some Field',
  type: 'Symbol',
  localized: true,
  required: false,
  validations: [],
};

const VALIDATIONS: Record<string, ContentTypeFieldValidation> = {
  unique: {
    unique: true,
  },
  explicitlyNotUnique: {
    unique: false,
  },
  size: {
    size: {
      min: 42,
      max: 420,
    },
  },
};

describe('validationDecorator', () => {
  describe('decorateFieldValidations()', () => {
    it('returns a field validation description for all supported Symbol field validations', () => {
      const result = decorateFieldValidations(FIELD);
      expect(result).toHaveLength(5);
    });

    it('honors implicitly disabled validations', () => {
      const result = decorateFieldValidations(FIELD);
      expectValidationIsEnabled(result, 'unique', false);
      expectValidationIsEnabled(result, 'size', false);
    });

    it('honors enabled uniqueness validation', () => {
      const result = decorateFieldValidations({ ...FIELD, validations: [VALIDATIONS.unique] });
      expectValidationIsEnabled(result, 'unique', true);
    });

    it('honors explicitly disabled uniqueness validation', () => {
      const result = decorateFieldValidations({
        ...FIELD,
        validations: [VALIDATIONS.explicitlyNotUnique],
      });
      expectValidationIsEnabled(result, 'unique', false);
    });

    it('recognizes enabled size validation', () => {
      const result = decorateFieldValidations({ ...FIELD, validations: [VALIDATIONS.size] });
      expectValidationIsEnabled(result, 'size', true);
    });
  });
});

function expectValidationIsEnabled(validations, validationType, isEnabled) {
  const validation = find(validations, { type: validationType });
  expect(validation.enabled).toEqual(isEnabled);
}
