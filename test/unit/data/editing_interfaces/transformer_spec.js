'use strict';

import _ from 'lodash';

describe('data/editingInterfaces/transformer', () => {
  const stubs = {};

  beforeEach(() => {
    stubs.getDefaultWidgetId = sinon.stub();
    stubs.migrateControl = sinon.stub().returnsArg(0);

    module('contentful/test', $provide => {
      $provide.constant('widgets/DefaultWidget.es6', { default: stubs.getDefaultWidgetId });
      $provide.constant('widgets/ControlMigrations.es6', { default: stubs.migrateControl });
    });
  });

  describe('#fromAPI()', () => {
    beforeEach(function() {
      const Transformer = this.$inject('data/editingInterfaces/transformer');
      this.fromAPI = Transformer.fromAPI;
    });

    it('adds default controls if control is missing', function() {
      const contentType = {
        fields: [{ apiName: 'MISSING' }, { apiName: 'AAA' }]
      };
      const editingInterface = {
        controls: [{ fieldId: 'AAA' }]
      };
      stubs.getDefaultWidgetId.withArgs({ apiName: 'MISSING' }).returns('DEF');

      const controls = this.fromAPI(contentType, editingInterface).controls;
      expect(controls.length).toBe(2);
      expect(controls[0].widgetId).toEqual('DEF');
      expect(controls[0].fieldId).toEqual('MISSING');
    });

    it('removes controls for missing fields', function() {
      const contentType = {
        fields: [{ apiName: 'AAA' }]
      };
      const editingInterface = {
        controls: [{ fieldId: 'MISSING' }, { fieldId: 'AAA' }]
      };

      const controls = this.fromAPI(contentType, editingInterface).controls;
      expect(controls.length).toBe(1);
      expect(controls[0].fieldId).toEqual('AAA');
    });

    it('migrates deprecated widgets', function() {
      const contentType = { fields: [{ apiName: 'AAA' }] };
      const control = { fieldId: 'AAA', widgetId: 'OLD' };
      const editingInterface = { controls: [control] };

      this.fromAPI(contentType, editingInterface);

      sinon.assert.calledOnce(stubs.migrateControl);
      expect(stubs.migrateControl.lastCall.args[0].fieldId).toBe('AAA');
    });

    describe('field mapping', () => {
      it('prefers the apiName over the field id', function() {
        const contentType = {
          fields: [{ id: 'id2', apiName: 'apiName' }, { id: 'apiName', apiName: 'field2' }]
        };

        const editingInterface = {
          controls: [{ widgetId: 'W', fieldId: 'apiName' }]
        };

        const controls = this.fromAPI(contentType, editingInterface).controls;
        const fieldIds = _.map(controls, 'fieldId');
        expect(fieldIds).toEqual(['apiName', 'field2']);
        expect(controls[0].widgetId).toEqual('W');
      });

      it('falls back on field id', function() {
        const contentType = {
          fields: [{ id: 'id1' }, { id: 'id2', apiName: 'apiName2' }]
        };

        const editingInterface = {
          controls: [{ widgetId: 'A', fieldId: 'id1' }, { widgetId: 'B', fieldId: 'apiName2' }]
        };

        const controls = this.fromAPI(contentType, editingInterface).controls;
        const fieldIds = _.map(controls, 'fieldId');
        expect(fieldIds).toEqual(['id1', 'apiName2']);
        const widgetIds = _.map(controls, 'widgetId');
        expect(widgetIds).toEqual(['A', 'B']);
      });
    });
  });
});
