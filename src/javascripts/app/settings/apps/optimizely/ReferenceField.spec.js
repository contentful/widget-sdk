'use strict';

import { hasVariationContainerInFieldLinkValidations } from './ReferenceField.es6';
import constants from './constants.es6';

describe('hasVariationContainerInFieldLinkValidations', () => {
  it("returns false if a field doesn't have variation container in the validations", () => {
    const field = { items: { validations: ['span', 'eggs', { linkContentType: ['foobar'] }] } };
    expect(hasVariationContainerInFieldLinkValidations(field)).toBe(false);
  });

  it('returns true if a field has variation container in the validations', () => {
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

    expect(hasVariationContainerInFieldLinkValidations(field)).toBe(true);
  });
});
