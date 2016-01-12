'use strict';

/* global afterAll */

describe('Editing interfaces service', function () {
  var widgets, editingInterfaces, cfStub;

  beforeEach(function () {
    module('contentful/test');

    widgets           = this.$inject('widgets');
    editingInterfaces = this.$inject('editingInterfaces');
    cfStub            = this.$inject('cfStub');
  });

  describe('#forContentType()', function() {
    beforeEach(function () {
      this.contentType = {
        getEditingInterface: sinon.stub(),
        getId: sinon.stub(),
        data: {fields: [ {id: 'id1',  apiName: 'apiName1'}]}
      };
    });

    describe('with API data', function() {
      beforeEach(function() {
        var contentType = this.contentType;

        contentType.getEditingInterface.resolves({
          data: {widgets: [{
            fieldId: 'apiName1',
            widgetParams: {},
          }]}
        });

        this.getEditingInterface = function () {
          var editingInterface;
          editingInterfaces.forContentType(contentType)
          .then(function (ei) {
            editingInterface = ei;
          });
          this.$apply();
          return editingInterface;
        };
      });

      it('requests the default id', function() {
        this.getEditingInterface();
        sinon.assert.calledWith(this.contentType.getEditingInterface, 'default');
      });

      it('returns editing interface with widgets', function() {
        var widgets = this.getEditingInterface().data.widgets;
        expect(widgets.length).toEqual(1);
      });

      it('adds widget if field widget is missing', function(){
        this.contentType.data.fields.push({
          id: 'id2',
          apiName: 'apiName2',
        });
        var widgets = this.getEditingInterface().data.widgets;

        expect(widgets[0].fieldId).toBe('apiName1');
        expect(widgets[1].fieldId).toBe('apiName2');
      });

      it('sets default widget parameters', function(){
        var widgets = this.$inject('widgets');
        sinon.stub(widgets, 'paramDefaults').returns({foo: 'bar'});
        var widgetArr = this.getEditingInterface().data.widgets;
        sinon.assert.called(widgets.paramDefaults);
        expect(widgetArr[0].widgetParams).toEqual({foo: 'bar'});
      });
    });

    pit('gets a default config if interface does not exit', function() {
      this.contentType.newEditingInterface = sinon.spy(function (data) {
        return {data: data};
      });
      this.contentType.getEditingInterface.rejects({statusCode: 404});
      return editingInterfaces.forContentType(this.contentType)
      .then(function (editingInterface) {
        expect(editingInterface.data.widgets).toBeDefined();
      });
    });

    it('fails if API returns error', function() {
      var apiError = {};
      var error;
      this.contentType.getEditingInterface.rejects(apiError);
      editingInterfaces.forContentType(this.contentType)
      .catch(function (_err) {
        error = _err;
      });
      this.$apply();
      expect(error).toBe(apiError);
    });

  });

  describe('#defaultInterface()', function() {
    var interf;
    beforeEach(function() {
      this.contentType =  {
        getId: sinon.stub(),
        data: {
          fields: [
            { id: 'id1', apiName: 'apiName1' },
            { id: 'id2', apiName: 'apiName2' }
          ]
        },
        newEditingInterface: sinon.spy(function(data){
          return { data: data };
        })
      };
      sinon.spy(widgets, 'defaultWidgetId');
      interf = editingInterfaces.defaultInterface(this.contentType);
    });

    afterAll(function () {
      widgets.defaultWidgetId.restore();
    });

    it('creates EI through CT', function() {
      sinon.assert.called(this.contentType.newEditingInterface);
    });

    it('has widgets', function() {
      expect(interf.data.widgets).toBeDefined();
    });

    it('maps to fieldIds to apiNames of the content type', function() {
      expect(interf.data.widgets[0].fieldId).toBe('apiName1');
      expect(interf.data.widgets[1].fieldId).toBe('apiName2');
    });

    it('gets widget type', function() {
      sinon.assert.called(widgets.defaultWidgetId);
    });
  });

  describe('#syncWidgets()', function() {
    beforeEach(function(){
      this.editingInterface = {data: {widgets: [
        {fieldId: 'apiName1'},
        {fieldId: 'apiName2'}
      ]}};
      this.contentType = {
        data: {fields: [
          {id: 'id1', apiName: 'apiName1'},
          {id: 'id2', apiName: 'apiName2'},
        ]},
        getId: sinon.stub().returns('fieldid')
      };
    });

    it('add widgets for missing fields', function() {
      this.contentType.data.fields.push({
        id: 'id3',
        apiName: 'apiName3',
      });
      editingInterfaces.syncWidgets(this.contentType, this.editingInterface);
      var expectedWidgets = [
        {fieldId: 'apiName1'},
        {fieldId: 'apiName2'},
        // The newly created widget
        {fieldId: 'apiName3', widgetId: undefined, widgetParams: {}}
      ];
      // Autogenerated id we can't match
      delete this.editingInterface.data.widgets[2].id;
      expect(this.editingInterface.data.widgets).toEqual(expectedWidgets);
    });

    it('removes widgets without fields', function() {
      this.editingInterface.data.widgets.push({id: 'noMatch'});
      editingInterfaces.syncWidgets(this.contentType, this.editingInterface);
      var expectedWidgets = [
        {fieldId: 'apiName1'},
        {fieldId: 'apiName2'}
      ];
      expect(this.editingInterface.data.widgets).toEqual(expectedWidgets);
    });
  });

  describe('#findField', function () {
    it('finds a field for a widget where the field has an apiName', function () {
      var fields = [
        {id: 'id1', apiName: 'apiName1'},
        {id: 'id2', apiName: 'apiName2'},
        {id: 'id3', apiName: 'apiName3'},
        {id: 'id4', apiName: 'apiName4'}
      ];
      var widget = {
        fieldId: 'apiName3'
      };
      var result = editingInterfaces.findField(fields, widget);
      var expected = {id: 'id3', apiName: 'apiName3'};
      expect(result).toEqual(expected);
    });

    it('finds a field for a widget where the field does not have an apiName', function () {
      var fields = [
        {id: 'id1', apiName: 'apiName1'},
        {id: 'fieldWithoutApiName'},
        {id: 'id3', apiName: 'apiName3'},
      ];
      var widget = {
        fieldId: 'fieldWithoutApiName'
      };
      var result = editingInterfaces.findField(fields, widget);
      var expected = {id: 'fieldWithoutApiName'};
      expect(result).toEqual(expected);
    });

    it('returns undefined when a matching field is not found', function () {
      var fields = [
        {id: 'id1', apiName: 'apiName1'},
        {id: 'fieldWithoutApiName'},
      ];
      var widget = {
        fieldId: 'missing'
      };
      var result = editingInterfaces.findField(fields, widget);
      expect(result).toBeUndefined();
    });

    it('returns undefined when a fieldId and apiNames are undefined', function () {
      var fields = [
        {id: 'id', apiName: undefined},
      ];
      var widget = {
        fieldId: undefined
      };
      var result = editingInterfaces.findField(fields, widget);
      expect(result).toBeUndefined();
    });
  });

  describe('#findWidget', function () {
    it('finds a widget for a field where the field has an apiName', function () {
      var widgetArr = [
        {fieldId: 'foo'},
        {fieldId: 'bar'},
        {fieldId: 'someApiName'}
      ];
      var field = {id: 'someId', apiName: 'someApiName'};
      var result = editingInterfaces.findWidget(widgetArr, field);
      var expected = {fieldId: 'someApiName'};
      expect(result).toEqual(expected);
    });

    it('finds a widget for a field where the field does not have an apiName', function () {
      var widgetArr = [
        {fieldId: 'foo'},
        {fieldId: 'bar'},
        {fieldId: 'someId'}
      ];
      var field = {id: 'someId'};
      var result = editingInterfaces.findWidget(widgetArr, field);
      var expected = {fieldId: 'someId'};
      expect(result).toEqual(expected);
    });

    it('returns undefined when a matching widget is not found', function () {
      var widgetArr = [
        {fieldId: 'foo'},
        {fieldId: 'bar'},
        {fieldId: 'someId'}
      ];
      var field = {id: 'abc'};
      var result = editingInterfaces.findWidget(widgetArr, field);
      expect(result).toBeUndefined();
    });

    it('returns undefined when a fieldId and apiName are undefined', function () {
      var widgetArr = [
        {fieldId: undefined},
      ];
      var field = {id: 'abc', apiName: undefined};
      var result = editingInterfaces.findWidget(widgetArr, field);
      expect(result).toBeUndefined();
    });
  });

  // These tests cover the migration of editing interface from internal IDs to external
  // apiNames. If the apiNames do not exist (for example old editor interfaces) we should
  // fall back on the id.
  // See https://contentful.atlassian.net/wiki/x/HwEJAg and
  // https://contentful.tpondemand.com/entity/7098
  describe('Editing interface migration tests', function() {
    // Should retrieve the content types' editor interface with `fieldId` mapped to apiNames.
    // It should *not* drop the widget and create a new one.
    describe('#forContentType()', function() {
      function makeContentType(fields, editingInterface) {
        return {
          data: {fields: fields},
          getEditingInterface: sinon.stub().resolves(editingInterface),
          getId: sinon.stub()
        };
      }

      pit('maps ids to apiNames for a non-migrated editing interface returned from API', function(){
        var contentTypeFields = [
          { id: 'id1', apiName: 'apiName1'},
          { id: 'id2', apiName: 'apiName2'}
        ];

        var editingInterfaceWidgets = [
          { id: 'id1', fieldId: 'id1' },
          { id: 'id2', fieldId: 'id2' }
        ];
        var expectedWidgets = [
          { id: 'id1', fieldId: 'apiName1' },
          { id: 'id2', fieldId: 'apiName2' }
        ];

        var editingInterface = {data: { widgets: editingInterfaceWidgets }};
        var contentType = makeContentType(contentTypeFields, editingInterface);
        return editingInterfaces.forContentType(contentType).then(function(editingInterface) {
          expect(editingInterface.data.widgets).toEqual(expectedWidgets);
        });
      });

      pit('falls back on id for a content type field that does not have an apiName', function() {
        var contentTypeFields = [{ id: 'id1'}];

        var editingInterfaceWidgets = [{ id: 'widget1', fieldId: 'id1' }];
        var expectedWidgets = _.cloneDeep(editingInterfaceWidgets);

        var editingInterface = {data: { widgets: editingInterfaceWidgets }};
        var contentType = makeContentType(contentTypeFields, editingInterface);

        return editingInterfaces.forContentType(contentType).then(function(editingInterface) {
          expect(editingInterface.data.widgets).toEqual(expectedWidgets);
        });
      });

      pit('does not manipulate a widget with an already remapped id to apiName', function(){
        var contentTypeFields = [{ id: 'id1', apiName: 'apiName1'}];

        var editingInterfaceWidgets = [{ id: 'widget1', fieldId: 'apiName1' }];
        var expectedWidgets = [{id: 'widget1', fieldId: 'apiName1'}];

        var editingInterface = {data: { widgets: editingInterfaceWidgets }};
        var contentType = makeContentType(contentTypeFields, editingInterface);

        return editingInterfaces.forContentType(contentType).then(function(editingInterface) {
          expect(editingInterface.data.widgets).toEqual(expectedWidgets);
        });
      });
    });

    describe('#syncWidgets()', function() {
      it('maps ids to apiName for non-migrated editing interfaces', function(){
        var contentTypeFields = [{ id: 'id1', apiName: 'apiName1'}];

        var editingInterfaceWidgets = [{ id: 'widget1', fieldId: 'id1'}];
        var expectedWidgets = [{ id: 'widget1', fieldId: 'apiName1'}];

        var contentType = {data: {fields: contentTypeFields}};
        var editingInterface = {data: {widgets: editingInterfaceWidgets}};

        var resultingEI = editingInterfaces.syncWidgets(contentType, editingInterface);
        expect(resultingEI.data.widgets).toEqual(expectedWidgets);
      });

      it('falls back on id for a content type field that does not have an apiName', function() {
        var contentTypeFields = [{ id: 'id1'}];

        var editingInterfaceWidgets = [{ id: 'widget1', fieldId: 'id1'}];
        var expectedWidgets = _.cloneDeep(editingInterfaceWidgets);

        var contentType = {data: {fields: contentTypeFields}};
        var editingInterface = {data: {widgets: editingInterfaceWidgets}};

        var resultingEI = editingInterfaces.syncWidgets(contentType, editingInterface);
        expect(resultingEI.data.widgets).toEqual(expectedWidgets);
      });

      it('does not re-create or prune a widget with an already remapped apiName', function () {
        var contentTypeFields = [{ id: 'id1', apiName: 'apiName1'}];

        var editingInterfaceWidgets = [{ id: 'widget1', fieldId: 'apiName1'}];
        var expectedWidgets = [{ id: 'widget1', fieldId: 'apiName1'}];

        var contentType = {data: {fields: contentTypeFields}};
        var editingInterface = {data: {widgets: editingInterfaceWidgets}};

        var resultingEI = editingInterfaces.syncWidgets(contentType, editingInterface);
        expect(resultingEI.data.widgets).toEqual(expectedWidgets);
      });
    });

    // Tests that the default widget uses a fields apiName and falls back to id
    describe('#defaultWidget()', function() {
      function makeContentType(fields) {
        return {
          data: {fields: fields},
          newEditingInterface: sinon.stub().returns({data: {widgets: []}}),
          getId: sinon.stub()
        };
      }

      it('creates a default interface and maps `fieldId` to apiName', function(){
        var contentTypeFields = [{ id: 'id1', apiName: 'apiName1'}];
        var contentType = makeContentType(contentTypeFields);

        var expectedWidgets = [
          {fieldId: 'apiName1', widgetId: undefined, widgetParams: {}}
        ];

        var resultingEI = editingInterfaces.defaultInterface(contentType);
        // Autogenerated id we can't match
        delete resultingEI.data.widgets[0].id;

        expect(resultingEI.data.widgets).toEqual(expectedWidgets);
      });

      it('falls back to `id` when `apiName` doesnt exist in a field', function() {
        var contentTypeFields = [{ id: 'id1'}];
        var contentType = makeContentType(contentTypeFields);

        var expectedWidgets = [
          {fieldId: 'id1', widgetId: undefined, widgetParams: {}}
        ];

        var resultingEI = editingInterfaces.defaultInterface(contentType);
        // Autogenerated id we can't match
        delete resultingEI.data.widgets[0].id;

        expect(resultingEI.data.widgets).toEqual(expectedWidgets);
      });
    });

  });
});

