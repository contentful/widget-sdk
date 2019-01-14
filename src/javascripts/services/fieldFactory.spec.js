import { uniq } from 'lodash';
import * as fieldFactory from './fieldFactory.es6';

describe('fieldFactory', () => {
  describe('type descriptor', () => {
    it('is unique per type', () => {
      const types = fieldFactory.FIELD_TYPES.map(t => t.name);
      expect(uniq(types)).toHaveLength(types.length);
    });

    it('has a label', () => {
      expect(fieldFactory.FIELD_TYPES.every(t => t.label)).toBe(true);
    });

    it('has list label if there is a list variant', () => {
      const listTypes = fieldFactory.FIELD_TYPES.filter(t => t.hasListVariant);
      expect(listTypes.every(t => t.listLabel)).toBe(true);
    });
  });

  describe('#getLabel', () => {
    it('returns single value labels from name', () => {
      fieldFactory.FIELD_TYPES.forEach(descriptor => {
        const field = fieldFactory.createTypeInfo(descriptor);
        const label = fieldFactory.getLabel(field);
        expect(label).toBe(descriptor.label);
      });
    });

    it('returns list labels from name', () => {
      const listFieldDescriptors = fieldFactory.FIELD_TYPES.filter(t => t.hasListVariant);
      listFieldDescriptors.forEach(descriptor => {
        const field = fieldFactory.createTypeInfo(descriptor, true);
        const label = fieldFactory.getLabel(field);
        expect(label).toBe(descriptor.listLabel);
      });
    });
  });

  describe('#createTypeInfo', () => {
    it('creates entry link info', () => {
      const descriptor = fieldFactory.FIELD_TYPES.find(t => t.name === 'Entry');
      const typeInfo = fieldFactory.createTypeInfo(descriptor);
      expect(typeInfo).toEqual({
        type: 'Link',
        linkType: 'Entry'
      });
    });

    it('creates entry list link info', () => {
      const descriptor = fieldFactory.FIELD_TYPES.find(t => t.name === 'Entry');
      const typeInfo = fieldFactory.createTypeInfo(descriptor, true);
      expect(typeInfo).toEqual({
        type: 'Array',
        items: {
          type: 'Link',
          linkType: 'Entry'
        }
      });
    });

    it('creates symbol list info', () => {
      const descriptor = fieldFactory.FIELD_TYPES.find(t => t.name === 'Symbol');
      const typeInfo = fieldFactory.createTypeInfo(descriptor, true);
      expect(typeInfo).toEqual({
        type: 'Array',
        items: {
          type: 'Symbol'
        }
      });
    });
  });
});
