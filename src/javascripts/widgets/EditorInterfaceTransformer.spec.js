import { fromAPI, toAPI } from './EditorInterfaceTransformer.es6';

jest.mock('./DefaultWidget.es6', () => jest.fn(() => 'DEFAULT'));
jest.mock('./ControlMigrations.es6', () => jest.fn(arg => arg));

describe('EditorInterfaceTransformer', () => {
  describe('#fromAPI()', () => {
    it('adds a default control if missing', () => {
      const ct = { fields: [{ apiName: 'AAA' }, { apiName: 'MISSING' }] };
      const ei = { controls: [{ fieldId: 'AAA' }] };

      jest
        .requireMock('./DefaultWidget.es6')
        .mockImplementationOnce(() => 'DEFAULT')
        .mockImplementationOnce(() => 'DEFAULT_FOR_MISSING');

      const { controls } = fromAPI(ct, ei);

      expect(controls).toHaveLength(2);
      expect(controls[0].widgetId).toEqual('DEFAULT');
      expect(controls[0].fieldId).toEqual('AAA');
      expect(controls[1].widgetId).toEqual('DEFAULT_FOR_MISSING');
      expect(controls[1].fieldId).toEqual('MISSING');
    });

    it('removes controls for missing fields', () => {
      const ct = { fields: [{ apiName: 'AAA' }] };
      const ei = { controls: [{ fieldId: 'MISSING' }, { fieldId: 'AAA' }] };

      const { controls } = fromAPI(ct, ei);

      expect(controls).toHaveLength(1);
      expect(controls[0].fieldId).toEqual('AAA');
    });

    it('migrates deprecated widgets', () => {
      const ct = { fields: [{ apiName: 'AAA' }] };
      const ei = { controls: [{ fieldId: 'AAA', widgetId: 'OLD' }] };

      const migrate = jest.requireMock('./ControlMigrations.es6');
      migrate.mockClear();
      migrate.mockImplementationOnce(control => ({ ...control, widgetId: 'MIGRATED' }));

      const { controls } = fromAPI(ct, ei);

      expect(migrate).toBeCalledTimes(1);
      expect(controls).toEqual([
        {
          field: { apiName: 'AAA' },
          fieldId: 'AAA',
          widgetId: 'MIGRATED'
        }
      ]);
    });

    it('restores field order', function() {
      const ct = { fields: [{ apiName: 'one' }, { apiName: 'two' }] };
      const ei = { controls: [{ fieldId: 'two' }, { fieldId: 'one' }] };

      const { controls } = fromAPI(ct, ei);

      expect(controls.map(c => c.fieldId)).toEqual(['one', 'two']);
    });

    it('keeps the sys property', () => {
      const ct = { fields: [] };
      const ei = { sys: { type: 'EditorInterface', id: 'eid' }, controls: [] };

      const { sys } = fromAPI(ct, ei);

      expect(sys).toEqual({ type: 'EditorInterface', id: 'eid' });
    });

    describe('field mapping', () => {
      it('prefers the apiName over the field ID', () => {
        const ct = {
          fields: [{ id: 'id2', apiName: 'apiName' }, { id: 'apiName', apiName: 'field2' }]
        };

        const ei = { controls: [{ widgetId: 'W', fieldId: 'apiName' }] };

        const { controls } = fromAPI(ct, ei);

        expect(controls.map(c => c.fieldId)).toEqual(['apiName', 'field2']);
        expect(controls[0].widgetId).toEqual('W');
      });

      it('falls back to the field ID', () => {
        const ct = {
          fields: [{ id: 'id1' }, { id: 'id2', apiName: 'apiName2' }]
        };

        const ei = {
          controls: [{ widgetId: 'A', fieldId: 'id1' }, { widgetId: 'B', fieldId: 'apiName2' }]
        };

        const { controls } = fromAPI(ct, ei);

        expect(controls.map(c => c.fieldId)).toEqual(['id1', 'apiName2']);
        expect(controls.map(c => c.widgetId)).toEqual(['A', 'B']);
      });
    });
  });

  describe('#toAPI()', () => {
    it('strips unknown properties', () => {
      const control = {
        fieldId: 'test',
        widgetId: 'helloWorld',
        settings: { test: true },
        field: { id: 'test' },
        unknown: 'test',
        oneMore: 666
      };

      const ct = { fields: [{ apiName: 'test' }] };
      const ei = { controls: [control] };

      const { controls } = toAPI(ct, ei);

      expect(controls).toEqual([
        { fieldId: 'test', widgetId: 'helloWorld', settings: { test: true } }
      ]);
    });

    it('removes empty settings', () => {
      const control = { fieldId: 'test', widgetId: 'helloWorld', settings: {} };
      const ct = { fields: [{ apiName: 'test' }] };
      const ei = { controls: [control] };

      const { controls } = toAPI(ct, ei);

      expect(controls).toEqual([{ fieldId: 'test', widgetId: 'helloWorld' }]);
    });

    it('restores field order', function() {
      const ct = { fields: [{ apiName: 'one' }, { apiName: 'two' }] };
      const ei = { controls: [{ fieldId: 'two' }, { fieldId: 'one' }] };

      const { controls } = toAPI(ct, ei);

      expect(controls.map(c => c.fieldId)).toEqual(['one', 'two']);
    });

    it('keeps the sys property', () => {
      const ct = { fields: [] };
      const ei = { sys: { type: 'EditorInterface', id: 'eid' }, controls: [] };

      const { sys } = toAPI(ct, ei);

      expect(sys).toEqual({ type: 'EditorInterface', id: 'eid' });
    });
  });
});
