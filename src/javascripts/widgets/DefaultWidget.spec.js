import _ from 'lodash';
import getDefaultWidgetId from './DefaultWidget.es6';
import { FIELD_TYPES, toApiFieldType } from './FieldTypes.es6';
import widgetMap from '@contentful/widget-map';

describe('DefaultWidget', () => {
  it('with an unsupported field type', () => {
    const field = { type: 'unsupportedtype' };
    expect(getDefaultWidgetId(field, 'displayfieldid')).toBeUndefined();
  });

  describe('if validations exist but are different', () => {
    const validations = [{ size: { max: 500, min: 0 } }];

    it('for a type with a dropdown widget', () => {
      const field = { type: 'Symbol', validations };
      expect(getDefaultWidgetId(field, 'displayfieldid')).toBe('singleLine');
    });

    it('for a type with no dropdown widget', () => {
      const field = { type: 'Date', validations };
      expect(getDefaultWidgetId(field, 'displayfieldid')).toBe('datePicker');
    });
  });

  describe('if validations exist', () => {
    const validations = [{ in: ['123'] }];

    it('for a type with a dropdown widget', () => {
      const field = { type: 'Symbol', validations };
      expect(getDefaultWidgetId(field, 'displayfieldid')).toBe('dropdown');
    });

    it('for a type with no dropdown widget', () => {
      const field = { type: 'Date', validations };
      expect(getDefaultWidgetId(field, 'displayfieldid')).toBe('datePicker');
    });
  });

  describe('if field is Text', () => {
    const field = { type: 'Text', id: 'textfield' };

    it('and is display field', () => {
      expect(getDefaultWidgetId(field, 'textfield')).toBe('singleLine');
    });

    it('is not a display field', () => {
      expect(getDefaultWidgetId(field, 'displayfieldid')).toBe('markdown');
    });
  });

  it('if field is RichText', () => {
    const field = { type: 'RichText' };
    expect(getDefaultWidgetId(field, 'displayfieldid')).toBe('richTextEditor');
  });

  it('if field is Entry', () => {
    const field = { type: 'Link', linkType: 'Entry' };
    expect(getDefaultWidgetId(field, 'displayfieldid')).toBe('entryLinkEditor');
  });

  it('if field is Asset', () => {
    const field = { type: 'Link', linkType: 'Asset' };
    expect(getDefaultWidgetId(field, 'displayfieldid')).toBe('assetLinkEditor');
  });

  it('if field is a list of Assets', () => {
    const field = { type: 'Array', items: { type: 'Link', linkType: 'Asset' } };
    expect(getDefaultWidgetId(field, 'displayfieldid')).toBe('assetLinksEditor');
  });

  it('if field is a list of Entries', () => {
    const field = { type: 'Array', items: { type: 'Link', linkType: 'Entry' } };
    expect(getDefaultWidgetId(field, 'displayfieldid')).toBe('entryLinksEditor');
  });

  it('returns default widget ID for each known field type', () => {
    FIELD_TYPES.forEach(type => {
      const id = getDefaultWidgetId(toApiFieldType(type), 'displayfieldid');
      expect(id).toBe(widgetMap.DEFAULTS[type]);
    });
  });
});
