'use strict';

describe('Editing interfaces service', function () {
  var editingInterfaces, $rootScope, $q;
  var contentType, stubs;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs(['defaultWidget', 'info', 'warn', 'serverError']);
      $provide.value('widgets', {
        defaultWidget: stubs.defaultWidget,
        registerWidget: angular.noop,
        paramDefaults: _.constant({})
      });

      $provide.value('notification', {
        info: stubs.info,
        warn: stubs.warn,
        serverError: stubs.serverError
      });

      contentType = {
        getEditingInterface: sinon.stub(),
        saveEditingInterface: sinon.stub(),
        newEditingInterface: function(data){
          return {
            getId: _.constant('default'),
            data: data
          };
        },
        getId: sinon.stub(),
        data: {}
      };

    });
    editingInterfaces = this.$inject('editingInterfaces');
    $q                = this.$inject('$q');
    $rootScope        = this.$inject('$rootScope');
    var cfStub        = this.$inject('cfStub');

    contentType.data.fields = [
      cfStub.field('fieldA'),
      cfStub.field('fieldB')
    ];
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('gets an interface for a content type with an id', function() {
    var config, err;

    describe('succeeds', function() {
      beforeEach(function() {
        this.$inject('widgets').paramDefaults = _.constant({foo: 'bar'});
        contentType.getEditingInterface.returns($q.when({
          data: {widgets: [{
            fieldId: 'fieldA',
            widgetParams: {foo: 'baz'}
          }]}
        }));
        editingInterfaces.forContentTypeWithId(contentType, 'edid').then(function (_config) {
          config = _config;
        });
        $rootScope.$apply();
      });

      it('requests the id', function() {
        expect(contentType.getEditingInterface).toBeCalledWith('edid');
      });

      it('gets a config', function() {
        expect(config).toBeDefined();
      });

      it('should add fields from the content Type that are missing in the user interface', function(){
        expect(config.data.widgets[0].fieldId).toBe('fieldA');
        expect(config.data.widgets[1].fieldId).toBe('fieldB');
      });

      it('should fill in defaults for parameters', function(){
        expect(config.data.widgets[0].widgetParams.foo).toBe('baz');
        expect(config.data.widgets[1].widgetParams.foo).toBe('bar');
      });
    });

    describe('fails with a 404 because config doesnt exist yet', function() {
      beforeEach(function() {
        contentType.getEditingInterface.returns($q.reject({statusCode: 404}));
        editingInterfaces.forContentTypeWithId(contentType, 'edid').then(function (_config) {
          config = _config;
        });
        $rootScope.$apply();
      });

      it('requests the id', function() {
        expect(contentType.getEditingInterface).toBeCalledWith('edid');
      });

      it('gets a default config', function() {
        expect(config).toBeDefined();
      });
    });

    describe('fails', function() {
      beforeEach(function() {
        contentType.getEditingInterface.returns($q.reject({}));
        editingInterfaces.forContentTypeWithId(contentType, 'edid').catch(function (_err) {
          err = _err;
        });
        $rootScope.$apply();
      });

      it('requests the id', function() {
        expect(contentType.getEditingInterface).toBeCalledWith('edid');
      });

      it('gets an error', function() {
        expect(err).toBeDefined();
      });
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
      expect(stubs.defaultWidget).toBeCalled();
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

    it('saves successfully', function() {
      save.resolve({});
      $rootScope.$apply();
      expect(stubs.info).toBeCalled();
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
      expect(stubs.warn).toBeCalled();
    });

    it('fails to save because of other error', function() {
      //interf.save.yield({});
      save.reject({});
      $rootScope.$apply();
      expect(stubs.serverError).toBeCalled();
    });
  });

  describe('syncs an interface to a contentType', function() {
    beforeEach(function(){
      this.editingInterface = {data: {widgets: [
        {fieldId: 'aaa'},
        {fieldId: 'bbb'}
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
      this.editingInterface.data.widgets.push({id: 'ccc'});
      editingInterfaces.syncWidgets(this.contentType, this.editingInterface);
      expect(this.editingInterface.data.widgets.length).toBe(2);
    });
  });

});
