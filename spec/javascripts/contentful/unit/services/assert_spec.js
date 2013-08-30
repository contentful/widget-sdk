'use strict';

describe('Assert service', function () {
  var assert, $rootScope;
  beforeEach(function () {
    module('contentful/test');
    inject(function (_$rootScope_, _assert_) {
      $rootScope = _$rootScope_;
      assert = _assert_;
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('asserts', function () {
    it('object throws', function () {
      expect(function () {
        assert.object(undefined);
      }).toThrow(assert.makeException('object'));
    });

    it('object does not throw', function () {
      expect(function () {
        assert.object({});
      }).not.toThrow(assert.makeException('object'));
    });

    it('object throws with no path at all', function () {
      var path = 'some.path';
      expect(function () {
        assert.path({}, path);
      }).toThrow(assert.makeException(path));
    });

    it('object throws with half defined path', function () {
      var path = 'some.path';
      var obj = {
        some: undefined
      };
      expect(function () {
        assert.path(obj, path);
      }).toThrow(assert.makeException(path));
    });

    it('object does not throw with defined path', function () {
      var path = 'some.path';
      var obj = {
        some: {
          path: '123'
        }
      };
      expect(function () {
        assert.path(obj, path);
      }).not.toThrow(assert.makeException(path));
    });


    it('object does not throw with empty string', function () {
      var path = 'some.path';
      var obj = {
        some: {
          path: ''
        }
      };
      expect(function () {
        assert.path(obj, path);
      }).not.toThrow(assert.makeException(path));
    });


    it('scope object throws with no path at all', function () {
      var path = 'some.path';
      expect(function () {
        assert.scopePath($rootScope, path);
      }).toThrow(assert.makeException(path));
    });

    it('scope object throws with half defined path', function () {
      var path = 'some.path';
      $rootScope.some = {
      };
      $rootScope.$apply();
      expect(function () {
        assert.scopePath($rootScope, path);
      }).toThrow(assert.makeException(path));
    });

    it('scope object does not throw with defined path', function () {
      var path = 'some.path';
      $rootScope.some = {
        path: '123'
      };
      $rootScope.$apply();
      expect(function () {
        assert.scopePath($rootScope, path);
      }).not.toThrow(assert.makeException(path));
    });

    it('scope object does not throw with empty string', function () {
      var path = 'some.path';
      $rootScope.some = {
        path: ''
      };
      $rootScope.$apply();
      expect(function () {
        assert.scopePath($rootScope, path);
      }).not.toThrow(assert.makeException(path));
    });

  });

});
