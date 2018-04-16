'use strict';

describe('widgets/default', function () {
  let getDefault, field;
  afterEach(function () {
    getDefault = field = null;
  });

  beforeEach(function () {
    module('contentful/test');
    field = {};
    getDefault = this.$inject('widgets/default');
  });

  it('with an unexistent field', function () {
    field.type = 'unsupportedtype';
    expect(getDefault(field, 'displayfieldid')).toBeUndefined();
  });

  describe('if validations exist but are different', function () {
    beforeEach(function () {
      field.validations = [{'size': {max: 500, min: 0}}];
    });

    it('for a type with a dropdown widget', function () {
      field.type = 'Symbol';
      expect(getDefault(field, 'displayfieldid')).toBe('singleLine');
    });

    it('for a type with no dropdown widget', function () {
      field.type = 'Date';
      expect(getDefault(field, 'displayfieldid')).toBe('datePicker');
    });
  });

  describe('if validations exist', function () {
    beforeEach(function () {
      field.validations = [{'in': ['123']}];
    });

    it('for a type with a dropdown widget', function () {
      field.type = 'Symbol';
      expect(getDefault(field, 'displayfieldid')).toBe('dropdown');
    });

    it('for a type with no dropdown widget', function () {
      field.type = 'Date';
      expect(getDefault(field, 'displayfieldid')).toBe('datePicker');
    });
  });

  describe('if field is Text', function () {
    beforeEach(function () {
      field.type = 'Text';
      field.id = 'textfield';
    });

    it('and is display field', function () {
      expect(getDefault(field, 'textfield')).toBe('singleLine');
    });

    it('is not a display field', function () {
      expect(getDefault(field, 'displayfieldid')).toBe('markdown');
    });
  });

  it('if field is Entry', function () {
    field.type = 'Link';
    field.linkType = 'Entry';
    expect(getDefault(field, 'displayfieldid')).toBe('entryLinkEditor');
  });

  it('if field is Asset', function () {
    field.type = 'Link';
    field.linkType = 'Asset';
    expect(getDefault(field, 'displayfieldid')).toBe('assetLinkEditor');
  });

  it('if field is a list of Assets', function () {
    field.type = 'Array';
    field.items = {type: 'Link', linkType: 'Asset'};
    expect(getDefault(field, 'displayfieldid')).toBe('assetLinksEditor');
  });

  it('if field is a list of Entries', function () {
    field.type = 'Array';
    field.items = {type: 'Link', linkType: 'Entry'};
    expect(getDefault(field, 'displayfieldid')).toBe('entryLinksEditor');
  });

  it('returns builtin widget id for each type', function () {
    const fieldFactory = this.$inject('fieldFactory');
    const builtins = this.$inject('widgets/builtin');

    _.forEach(fieldFactory.types, function (typeDescriptor) {
      let field = fieldFactory.createTypeInfo(typeDescriptor);
      let widgetId = getDefault(field, 'displayfieldid');
      expect(typeof _.find(builtins, {id: widgetId})).toBe('object');

      if (typeDescriptor.hasListVariant) {
        field = fieldFactory.createTypeInfo(typeDescriptor, true);
        widgetId = getDefault(field, 'displayfieldid');
        expect(typeof _.find(builtins, {id: widgetId})).toBe('object');
      }
    });
  });
});
