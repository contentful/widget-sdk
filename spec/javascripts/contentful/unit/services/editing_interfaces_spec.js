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
        getId: sinon.stub(),
        data: {
          fields: [
            {id: 'firstfield'}
          ]
        }
      };

    });
    inject(function ($injector) {
      editingInterfaces = $injector.get('editingInterfaces');
      $rootScope = $injector.get('$rootScope');
      $q = $injector.get('$q');
    });
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
        contentType.getEditorInterface.yield(null, {});
        $rootScope.$apply();
      });

      it('requests the id', function() {
        expect(contentType.getEditorInterface).toBeCalledWith('edid');
      });

      it('gets a config', function() {
        expect(config).toBeDefined();
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
      expect(interf.id).toBe('default');
    });

    it('has widgets', function() {
      expect(interf.widgets).toBeDefined();
    });

    it('has first field', function() {
      expect(interf.widgets[0].fieldId).toBe('firstfield');
    });

    it('gets widget type', function() {
      expect(stubs.defaultType).toBeCalled();
    });
  });

  describe('saves interface for a content type', function() {
    var interf;
    beforeEach(function() {
      interf = {};
      editingInterfaces.saveForContentType(contentType, interf);
      $rootScope.$apply();
    });

    it('saves successfully', function() {
      contentType.saveEditorInterface.yield(null, {});
      expect(stubs.info).toBeCalled();
    });

    it('fails to save because of version mismatch', function() {
      contentType.saveEditorInterface.yield({body: {sys: {type: 'Error', id: 'VersionMismatch'}}});
      expect(stubs.warn).toBeCalled();
    });

    it('fails to save because of other error', function() {
      contentType.saveEditorInterface.yield({});
      expect(stubs.serverError).toBeCalled();
    });

  });

});
