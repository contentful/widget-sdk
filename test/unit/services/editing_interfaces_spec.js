'use strict';

describe('Editing interfaces service', function () {
  var editingInterfaces, $rootScope, $q, logger, notification;
  var contentType, stubs;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs(['defaultWidgetId']);
      $provide.value('widgets', {
        defaultWidgetId: stubs.defaultWidgetId,
        registerWidget: angular.noop,
        paramDefaults: _.constant({})
      });

      contentType = {
        getEditingInterface: sinon.stub(),
        saveEditingInterface: sinon.stub(),
        getId: sinon.stub(),
        data: {},
        newEditingInterface: function(data){
          data.contentTypId = contentType.getId();
          return {
            getId: _.constant('default'),
            data: data
          };
        }
      };

    });

    editingInterfaces = this.$inject('editingInterfaces');
    $q                = this.$inject('$q');
    $rootScope        = this.$inject('$rootScope');
    logger            = this.$inject('logger');
    notification      = this.$inject('notification');
    var cfStub        = this.$inject('cfStub');

    contentType.data.fields = [
      cfStub.field('fieldA'),
      cfStub.field('fieldB')
    ];
  });

  describe('#forContentType()', function() {
    var config;

    describe('success', function() {
      beforeEach(function() {
        this.$inject('widgets').paramDefaults = _.constant({foo: 'bar'});
        contentType.getEditingInterface.resolves({
          data: {widgets: [{
            fieldId: 'fieldA',
            widgetParams: {foo: 'baz'}
          }]}
        });
        editingInterfaces.forContentType(contentType)
        .then(function (_config) {
          config = _config;
        });
        this.$apply();
      });

      it('requests the default id', function() {
        sinon.assert.calledWith(contentType.getEditingInterface, 'default');
      });

      it('gets a config', function() {
        expect(config).toBeDefined();
      });

      it('should add fields from the content type that are missing in the user interface', function(){
        expect(config.data.widgets[0].fieldId).toBe('fieldA');
        expect(config.data.widgets[1].fieldId).toBe('fieldB');
      });

      it('should fill in defaults for parameters', function(){
        expect(config.data.widgets[0].widgetParams.foo).toBe('baz');
        expect(config.data.widgets[1].widgetParams.foo).toBe('bar');
      });
    });

    pit('gets a default config if interface does not exit', function() {
      contentType.getEditingInterface.rejects({statusCode: 404});
      return editingInterfaces.forContentType(contentType)
      .then(function (config) {
        expect(config).toBeDefined();
      });
    });

    it('fails if API returns error', function() {
      var apiError = {};
      var error;
      contentType.getEditingInterface.rejects(apiError);
      editingInterfaces.forContentType(contentType)
      .catch(function (_err) {
        error = _err;
      });
      this.$apply();
      expect(error).toBe(apiError);
    });

  });

  describe('gets a default interface', function() {
    var interf;
    beforeEach(function() {
      interf = editingInterfaces.defaultInterface(contentType);
    });

    it('has id', function() {
      expect(interf.getId()).toBe('default');
    });

    it('has widgets', function() {
      expect(interf.data.widgets).toBeDefined();
    });

    it('has first field', function() {
      expect(interf.data.widgets[0].fieldId).toBe('fieldA');
    });

    it('gets widget type', function() {
      sinon.assert.called(stubs.defaultWidgetId);
    });

    describe('gets a default interface again', function() {
      var interf2;
      beforeEach(function() {
        interf2 = editingInterfaces.defaultInterface(contentType);
      });

      it('has same field ids', function() {
        expect(interf2.data.widgets[0].fieldId).toBe('fieldA');
      });

      it('has same widget ids', function() {
        expect(interf2.data.widgets[0].id).toBe(interf.data.widgets[0].id);
      });

    });
  });

  describe('saves interface for a content type', function() {
    var interf, promise, save;
    beforeEach(function() {
      save = $q.defer();
      interf = { save: sinon.stub().returns(save.promise) };
      promise = editingInterfaces.save(interf);
      $rootScope.$apply();
    });

    it('returns the editing interface from the server', function(){
      promise.then(function(interf) {
        expect(interf.newVersion).toBe(true);
      });
      save.resolve({newVersion: true});
      $rootScope.$apply();
    });

    it('fails to save because of version mismatch', function() {
      save.reject({body: {sys: {type: 'Error', id: 'VersionMismatch'}}});
      //interf.save.yield({body: {sys: {type: 'Error', id: 'VersionMismatch'}}});
      $rootScope.$apply();
      sinon.assert.called(notification.warn);
    });

    it('fails to save because of other error', function() {
      //interf.save.yield({});
      save.reject({});
      $rootScope.$apply();
      sinon.assert.called(logger.logServerWarn);
      sinon.assert.called(notification.error);
    });
  });

  describe('syncs an interface to a contentType', function() {
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
