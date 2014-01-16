'use strict';

describe('The contentTypeDescription directive', function () {

  var container, scope;
  var compileElement;
  var stubs;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([]);
    });

    inject(function ($rootScope, $compile) {
      scope = $rootScope.$new();

      compileElement = function () {
        container = $('<div class="content-type-description"></div>');
        $compile(container)(scope);
        scope.$digest();
      };
    });
  });

  afterEach(inject(function ($log) {
    container.remove();
    $log.assertEmpty();
  }));

  function makeDescriptionTest(type) {
    it('renders '+type+' description', function() {
      scope.type = {
        value: {
          type: type
        }
      };
      compileElement();
      expect(container.find('h3').get(0)).toBeDefined();
    });
  }

  _.each([
    'Text',
    'Symbol',
    'Integer',
    'Number',
    'Boolean',
    'Date',
    'Location',
    'Object',
    'Link',
    'Array',
  ], makeDescriptionTest);

});
