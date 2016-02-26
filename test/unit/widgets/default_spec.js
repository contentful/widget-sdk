'use strict';

describe('widgets/default', function () {
  var getDefault, field, contentType;

  beforeEach(function() {
    module('contentful/test');
    contentType = {
      data: {},
      getId: sinon.stub()
    };
    field = {};
    getDefault = this.$inject('widgets/default');
  });

  it('with an unexistent field', function() {
    field.type = 'unsupportedtype';
    expect(getDefault(field, contentType)).toBeUndefined();
  });

  describe('if validations exist but are different', function() {
    beforeEach(function() {
      field.validations = [{'size': {max: 500, min: 0}}];
    });

    it('for a type with a dropdown widget', function() {
      field.type = 'Symbol';
      expect(getDefault(field, contentType)).toBe('singleLine');
    });

    it('for a type with no dropdown widget', function() {
      field.type = 'Date';
      expect(getDefault(field, contentType)).toBe('datePicker');
    });
  });

  describe('if validations exist', function() {
    beforeEach(function() {
      field.validations = [{'in': ['123']}];
    });

    it('for a type with a dropdown widget', function() {
      field.type = 'Symbol';
      expect(getDefault(field, contentType)).toBe('dropdown');
    });

    it('for a type with no dropdown widget', function() {
      field.type = 'Date';
      expect(getDefault(field, contentType)).toBe('datePicker');
    });
  });

  describe('if field is Text', function() {
    beforeEach(function() {
      field.type = 'Text';
      field.id = 'textfield';
    });

    it('and is display field', function() {
      contentType.data.displayField = 'textfield';
      expect(getDefault(field, contentType)).toBe('singleLine');
    });

    it('is not a display field', function() {
      expect(getDefault(field, contentType)).toBe('markdown');
    });
  });

  it('if field is Entry', function() {
    field.type = 'Link';
    field.linkType = 'Entry';
    expect(getDefault(field, contentType)).toBe('entryLinkEditor');
  });

  it('if field is Asset', function() {
    field.type = 'Link';
    field.linkType = 'Asset';
    expect(getDefault(field, contentType)).toBe('assetLinkEditor');
  });

  it('if field is a list of Assets', function() {
    field.type = 'Array';
    field.items = {type: 'Link', linkType: 'Asset'};
    expect(getDefault(field, contentType)).toBe('assetLinksEditor');
  });

  it('if field is a list of Entries', function() {
    field.type = 'Array';
    field.items = {type: 'Link', linkType: 'Entry'};
    expect(getDefault(field, contentType)).toBe('entryLinksEditor');
  });

  it('returns builtin widget id for each type', function () {
    var fieldFactory = this.$inject('fieldFactory');
    var builtins = this.$inject('widgets/builtin');

    _.forEach(fieldFactory.types, function (typeDescriptor) {
      var field = fieldFactory.createTypeInfo(typeDescriptor);
      var widgetId = getDefault(field, contentType);
      expect(widgetId in builtins).toBe(true);

      if (typeDescriptor.hasListVariant) {
        field = fieldFactory.createTypeInfo(typeDescriptor, true);
        widgetId = getDefault(field, contentType);
        expect(widgetId in builtins).toBe(true);
      }
    });
  });
});
