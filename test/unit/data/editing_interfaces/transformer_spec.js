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

    it('adds default widgets if widget is missing', function () {
      var contentType = {
        fields: [
          {apiName: 'MISSING'},
          {apiName: 'AAA'}
        ]
      };
      var editingInterface = {
        widgets: [
          {fieldId: 'AAA'}
        ]
      };
      getDefaultWidget.withArgs({apiName: 'MISSING'}).returns('DEF');

      var widgets = this.fromAPI(contentType, editingInterface).widgets;
      expect(widgets.length).toBe(2);
      expect(widgets[0].widgetId).toEqual('DEF');
      expect(widgets[0].fieldId).toEqual('MISSING');
    });

    it('removes widgets for missing fields', function () {
      var contentType = {
        fields: [{apiName: 'AAA'}]
      };
      var editingInterface = {
        widgets: [
          { fieldId: 'MISSING' },
          { fieldId: 'AAA' }
        ]
      };

      var widgets = this.fromAPI(contentType, editingInterface).widgets;
      expect(widgets.length).toBe(1);
      expect(widgets[0].fieldId).toEqual('AAA');
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
        widgets: [{ fieldId: 'AAA', widgetId: 'OLD' }]
      };

      var widgets = this.fromAPI(contentType, editingInterface).widgets;
      expect(widgets[0].widgetId).toEqual('NEW');
    });

    describe('fieldId migration', function () {
      it('maps ids to apiNames for a non-migrated editing interface returned from API', function(){
        var contentType = {fields: [
          { id: 'id1', apiName: 'apiName1' },
          { id: 'id2', apiName: 'apiName2' },
          { id: 'id3', apiName: 'apiName3' }
        ]};

        var editingInterface = {widgets: [
          { fieldId: 'id1' },
          { fieldId: 'apiName2' },
          { fieldId: 'id3' }
        ]};

        var widgets = this.fromAPI(contentType, editingInterface).widgets;
        var fieldIds = _.map(widgets, 'fieldId');
        expect(fieldIds).toEqual(['apiName1', 'apiName2', 'apiName3']);
      });

      it('falls back on id for a content type field that does not have an apiName', function() {
        var contentType = {fields: [
          { id: 'id1' },
        ]};

        var editingInterface = {widgets: [
          { fieldId: 'id1' },
        ]};

        var widgets = this.fromAPI(contentType, editingInterface).widgets;
        expect(widgets[0].fieldId).toEqual('id1');
      });

      xit('prefers the apiName over the field id', function() {
        var contentType = {fields: [
          { id: 'id2', apiName: 'AAA' },
          { id: 'AAA', apiName: 'apiName1' },
        ]};

        var editingInterface = {widgets: [
          { fieldId: 'AAA' },
        ]};

        var widgets = this.fromAPI(contentType, editingInterface).widgets;
        var fieldIds = _.map(widgets, 'fieldId');
        expect(fieldIds).toEqual(['AAA', 'apiName1']);
      });
    });
  });
});
