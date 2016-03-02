'use strict';

describe('data/editingInterfaces/transformer', function () {
  var getDefaultWidget;

  beforeEach(function () {
    getDefaultWidget = sinon.stub();
    module('contentful/test', function ($provide) {
      $provide.value('widgets/default', getDefaultWidget);
    });
  });

  describe('#fromAPI()', function () {

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

    describe('fieldId migration', function () {
      it('maps ids to apiNames for a non-migrated editing interface returned from API', function(){
        var contentType = {fields: [
          { id: 'id1', apiName: 'apiName1' },
          { id: 'id2', apiName: 'apiName2' },
          { id: 'id3', apiName: 'apiName3' }
        ]};

        var editingInterface = {controls: [
          { fieldId: 'id1' },
          { fieldId: 'apiName2' },
          { fieldId: 'id3' }
        ]};

        var controls = this.fromAPI(contentType, editingInterface).controls;
        var fieldIds = _.map(controls, 'fieldId');
        expect(fieldIds).toEqual(['apiName1', 'apiName2', 'apiName3']);
      });

      it('falls back on id for a content type field that does not have an apiName', function() {
        var contentType = {fields: [
          { id: 'id1' },
        ]};

        var editingInterface = {controls: [
          { fieldId: 'id1' },
        ]};

        var controls = this.fromAPI(contentType, editingInterface).controls;
        expect(controls[0].fieldId).toEqual('id1');
      });

      xit('prefers the apiName over the field id', function() {
        var contentType = {fields: [
          { id: 'id2', apiName: 'AAA' },
          { id: 'AAA', apiName: 'apiName1' },
        ]};

        var editingInterface = {controls: [
          { fieldId: 'AAA' },
        ]};

        var controls = this.fromAPI(contentType, editingInterface).controls;
        var fieldIds = _.map(controls, 'fieldId');
        expect(fieldIds).toEqual(['AAA', 'apiName1']);
      });
    });
  });
});
