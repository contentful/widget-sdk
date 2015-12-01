'use strict';

describe('Editing interfaces service', function () {
  var editingInterfaces, $q, cfStub;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.value('widgets', {
        defaultWidgetId: sinon.stub(),
        paramDefaults: sinon.stub().returns({})
      });
    });

    editingInterfaces = this.$inject('editingInterfaces');
    $q                = this.$inject('$q');
    cfStub            = this.$inject('cfStub');
  });

  describe('#forContentType()', function() {
    beforeEach(function () {
      this.contentType = {
        getEditingInterface: sinon.stub(),
        getId: sinon.stub(),
        data: {fields: [
          cfStub.field('fieldA')
        ]},
      };
    });

    describe('with API data', function() {
      beforeEach(function() {
        var contentType = this.contentType;

        contentType.getEditingInterface.resolves({
          data: {widgets: [{
            fieldId: 'fieldA',
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
        this.contentType.data.fields.push(cfStub.field('fieldWithoutWidget'));
        var widgets = this.getEditingInterface().data.widgets;
        expect(widgets[0].fieldId).toBe('fieldA');
        expect(widgets[1].fieldId).toBe('fieldWithoutWidget');
      });

      it('sets default widget parameters', function(){
        var Widgets = this.$inject('widgets');
        Widgets.paramDefaults = sinon.stub().returns({foo: 'bar'});
        var widgets = this.getEditingInterface().data.widgets;
        sinon.assert.calledWith(Widgets.paramDefaults);
        expect(widgets[0].widgetParams).toEqual({foo: 'bar'});
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
            cfStub.field('fieldA'),
            cfStub.field('fieldB')
          ]
        },
        newEditingInterface: sinon.spy(function(data){
          return { data: data };
        })
      };
      interf = editingInterfaces.defaultInterface(this.contentType);
    });

    it('creates EI through CT', function() {
      sinon.assert.called(this.contentType.newEditingInterface);
    });

    it('has widgets', function() {
      expect(interf.data.widgets).toBeDefined();
    });

    it('has first field', function() {
      expect(interf.data.widgets[0].fieldId).toBe('fieldA');
    });

    it('gets widget type', function() {
      var Widgets = this.$inject('widgets');
      sinon.assert.called(Widgets.defaultWidgetId);
    });
  });

  describe('#syncWidgets()', function() {
    beforeEach(function(){
      this.editingInterface = {data: {widgets: [
        {fieldId: 'aaa', widgetType: 'field'},
        {fieldId: 'bbb', widgetType: 'field'}
      ]}};
      this.contentType = {
        data: {fields: [
          {id: 'aaa'},
          {id: 'bbb'},
        ]},
        getId: sinon.stub().returns('fieldid')
      };
    });

    it('add widgets for missing fields', function() {
      this.contentType.data.fields.push({id: 'ccc', type: 'Symbol'});
      editingInterfaces.syncWidgets(this.contentType, this.editingInterface);
      expect(this.editingInterface.data.widgets[2].fieldId).toBe('ccc');
    });

    it('removes widgets without fields', function() {
      this.editingInterface.data.widgets.push({id: 'ccc', widgetType: 'field'});
      editingInterfaces.syncWidgets(this.contentType, this.editingInterface);
      expect(this.editingInterface.data.widgets.length).toBe(2);
    });

    // TODO reactivate when static widgets are fixed
    xit('does not remove static widgets', function() {
      this.editingInterface.data.widgets.push({id: 'ccc', widgetType: 'static'});
      editingInterfaces.syncWidgets(this.contentType, this.editingInterface);
      expect(this.editingInterface.data.widgets.length).toBe(3);
    });
  });

});
