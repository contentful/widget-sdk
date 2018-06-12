'use strict';

describe('data/editingInterfaces/transformer', () => {
  var getDefaultWidget;

  beforeEach(() => {
    getDefaultWidget = sinon.stub();
    module('contentful/test', $provide => {
      $provide.value('widgets/default', getDefaultWidget);
    });
  });

  describe('#fromAPI()', () => {

    beforeEach(function () {
      var Transformer = this.$inject('data/editingInterfaces/transformer');
      this.fromAPI = Transformer.fromAPI;
    });

    it('adds default controls if control is missing', function () {
      var contentType = {
        fields: [
          {apiName: 'MISSING'},
          {apiName: 'AAA'}
        ]
      };
      var editingInterface = {
        controls: [
          {fieldId: 'AAA'}
        ]
      };
      getDefaultWidget.withArgs({apiName: 'MISSING'}).returns('DEF');

      var controls = this.fromAPI(contentType, editingInterface).controls;
      expect(controls.length).toBe(2);
      expect(controls[0].widgetId).toEqual('DEF');
      expect(controls[0].fieldId).toEqual('MISSING');
    });

    it('removes controls for missing fields', function () {
      var contentType = {
        fields: [{apiName: 'AAA'}]
      };
      var editingInterface = {
        controls: [
          { fieldId: 'MISSING' },
          { fieldId: 'AAA' }
        ]
      };

      var controls = this.fromAPI(contentType, editingInterface).controls;
      expect(controls.length).toBe(1);
      expect(controls[0].fieldId).toEqual('AAA');
    });

    it('migrates deprecated widgets', function () {
      var migrations = this.$inject('widgets/migrations/data');
      migrations.push({
        from: 'OLD',
        to: 'NEW',
      });

      var contentType = {
        fields: [{ apiName: 'AAA' }]
      };
      var editingInterface = {
        controls: [{ fieldId: 'AAA', widgetId: 'OLD' }]
      };

      var controls = this.fromAPI(contentType, editingInterface).controls;
      expect(controls[0].widgetId).toEqual('NEW');
    });

    describe('field mapping', () => {
      it('prefers the apiName over the field id', function() {
        var contentType = {fields: [
          { id: 'id2', apiName: 'apiName' },
          { id: 'apiName', apiName: 'field2' }
        ]};

        var editingInterface = {controls: [
          { widgetId: 'W', fieldId: 'apiName' }
        ]};

        var controls = this.fromAPI(contentType, editingInterface).controls;
        var fieldIds = _.map(controls, 'fieldId');
        expect(fieldIds).toEqual(['apiName', 'field2']);
        expect(controls[0].widgetId).toEqual('W');
      });

      it('falls back on field id', function(){
        var contentType = {fields: [
          { id: 'id1' },
          { id: 'id2', apiName: 'apiName2' },
        ]};

        var editingInterface = {controls: [
          { widgetId: 'A', fieldId: 'id1'},
          { widgetId: 'B', fieldId: 'apiName2' },
        ]};

        var controls = this.fromAPI(contentType, editingInterface).controls;
        var fieldIds = _.map(controls, 'fieldId');
        expect(fieldIds).toEqual(['id1', 'apiName2']);
        var widgetIds = _.map(controls, 'widgetId');
        expect(widgetIds).toEqual(['A', 'B']);
      });
    });
  });
});
