import * as Utils from 'widgets/WidgetParametersUtils';

describe('WidgetParametersUtils', () => {
  describe('.filterDefinitions', () => {
    const definitions = [{id: 'format'}, {id: 'ampm'}];
    const widget = {id: 'datePicker', custom: false};

    it('filters out time mode parameter if is date only', () => {
      const values = {format: 'dateonly'};
      const filtered = Utils.filterDefinitions(definitions, values, widget);
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('format');
    });

    it('retains time mode parameter if format includes time', () => {
      const values = {format: 'time'};
      const filtered = Utils.filterDefinitions(definitions, values, widget);
      expect(filtered.length).toBe(2);
    });

    it('retains time mode parameter if is not builtin date picker', () => {
      const values = {format: 'dateonly'};
      const extension = {id: 'datePicker', custom: true};
      const filtered = Utils.filterDefinitions(definitions, values, extension);
      expect(filtered.length).toBe(2);
    });

    it('does not touch widgets different than date picker', () => {
      const values = {format: 'dateonly'};
      const filtered = Utils.filterDefinitions(definitions, values, {id: 'test'});
      expect(filtered.length).toBe(2);
    });
  });

  describe('.filterValues', () => {
    const definitions = [{id: 'foo'}];

    it('removes unknown parameter values', () => {
      const values = {unknown: true};
      const filtered = Utils.filterValues(definitions, values);
      expect(filtered).toEqual({});
    });

    it('retains known parameter values', () => {
      const values = {foo: true, unknown: true};
      const filtered = Utils.filterValues(definitions, values);
      expect(filtered).toEqual({foo: true});
    });

    it('removes undefined parameter values', () => {
      const values = {foo: undefined};
      const filtered = Utils.filterValues(definitions, values);
      expect(filtered).toEqual({});
    });

    it('returns an empty object if no parameters are defined', () => {
      const values = {test: true};
      const filtered = Utils.filterValues([], values);
      expect(filtered).toEqual({});
    });
  });

  describe('.markMissingValues', () => {
    const definitions = [{id: 'x', required: true}, {id: 'y'}];

    it('marks not provided required values as missing', () => {
      const missing = Utils.markMissingValues(definitions, {});
      expect(missing).toEqual({x: true});
    });

    it('does not mark as missing if provided or not required', () => {
      const missing = Utils.markMissingValues(definitions, {x: 'test'});
      expect(missing).toEqual({});
    });
  });

  describe('.applyDefaultValues', () => {
    const definitions = [{id: 'x', default: 'DEFAULT'}];

    it('sets missing parameters to default value', () => {
      const values = Utils.applyDefaultValues(definitions, {});
      expect(values.x).toBe('DEFAULT');
    });

    it('does not overwrite existing values', () => {
      const values = Utils.applyDefaultValues(definitions, {x: 'VALUE'});
      expect(values.x).toBe('VALUE');
    });

    it('does not overwrite keys explicitly set to undefined', () => {
      const values = Utils.applyDefaultValues(definitions, {x: undefined});
      expect(values.x).toBe(undefined);
    });

    it('works if there is no object for current values', () => {
      const values = Utils.applyDefaultValues(definitions, undefined);
      expect(typeof values).toBe('object');
      expect(values.x).toBe('DEFAULT');
    });

    it('does not touch not defined values', () => {
      const values = Utils.applyDefaultValues(definitions, {y: 'test', z: undefined});
      expect(values).toEqual({x: 'DEFAULT', y: 'test', z: undefined});
    });
  });

  describe('.unifyEnumOptions', () => {
    const definitions = [
      {id: 'x', type: 'Enum', options: ['one', 'two']},
      {id: 'y', type: 'Enum', options: [{one: 'Einz'}, {two: 'Zwei'}]},
      {id: 'z', type: 'Symbol'}
    ];

    it('converts shorthand options to labelled options', () => {
      const unified = Utils.unifyEnumOptions(definitions);
      expect(unified[0].options).toEqual([{one: 'one'}, {two: 'two'}]);
    });

    it('does not touch labelled options or parameters that are not Enums', () => {
      const unified = Utils.unifyEnumOptions(definitions);
      expect(unified[1].options).toEqual([{one: 'Einz'}, {two: 'Zwei'}]);
      expect(unified[2]).toEqual({id: 'z', type: 'Symbol'});
    });
  });
});
