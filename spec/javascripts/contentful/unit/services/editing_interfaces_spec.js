'use strict';

describe('Editing interfaces service', function () {
  var editingInterfaces, $rootScope, $q;
  var contentType, stubs;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs(['defaultType', 'info', 'warn', 'serverError']);
      $provide.value('widgetTypes', {
        defaultType: stubs.defaultType
      });

      $provide.value('notification', {
        info: stubs.info,
        warn: stubs.warn,
        serverError: stubs.serverError
      });

      contentType = {
        getEditorInterface: sinon.stub(),
        saveEditorInterface: sinon.stub(),
        newEditorInterface: function(data){
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
        editingInterfaces.forContentTypeWithId(contentType, 'edid').then(function (_config) {
          config = _config;
        });
        contentType.getEditorInterface.yield(null, {
          data: {widgets: []}
        });
        $rootScope.$apply();
      });

      it('requests the id', function() {
        expect(contentType.getEditorInterface).toBeCalledWith('edid');
      });

      it('gets a config', function() {
        expect(config).toBeDefined();
      });

      it('should add fields from the content Type that are missing in the user interface', function(){
        expect(config.data.widgets[0].fieldId).toBe('fieldA');
        expect(config.data.widgets[1].fieldId).toBe('fieldB');
      });
    });

    describe('fails with a 404 because config doesnt exist yet', function() {
      beforeEach(function() {
        editingInterfaces.forContentTypeWithId(contentType, 'edid').then(function (_config) {
          config = _config;
        });
        contentType.getEditorInterface.yield({statusCode: 404});
        $rootScope.$apply();
      });

      it('requests the id', function() {
        expect(contentType.getEditorInterface).toBeCalledWith('edid');
      });

      it('gets a default config', function() {
        expect(config).toBeDefined();
      });
    });

    describe('fails', function() {
      beforeEach(function() {
        editingInterfaces.forContentTypeWithId(contentType, 'edid').catch(function (_err) {
          err = _err;
        });
        contentType.getEditorInterface.yield({});
        $rootScope.$apply();
      });

      it('requests the id', function() {
        expect(contentType.getEditorInterface).toBeCalledWith('edid');
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
      expect(stubs.defaultType).toBeCalled();
    });
  });

  describe('saves interface for a content type', function() {
    var interf, promise;
    beforeEach(function() {
      interf = { save: sinon.stub() };
      promise = editingInterfaces.save(interf);
      $rootScope.$apply();
    });

    it('saves successfully', function() {
      interf.save.yield(null, {});
      expect(stubs.info).toBeCalled();
    });

    it('returns the editing interface from the server', function(){
      promise.then(function(interf) {
        expect(interf.newVersion).toBe(true);
      });
      interf.save.yield(null, {newVersion: true});
    });
    

    it('fails to save because of version mismatch', function() {
      interf.save.yield({body: {sys: {type: 'Error', id: 'VersionMismatch'}}});
      expect(stubs.warn).toBeCalled();
    });

    it('fails to save because of other error', function() {
      interf.save.yield({});
      expect(stubs.serverError).toBeCalled();
    });

  });

});
