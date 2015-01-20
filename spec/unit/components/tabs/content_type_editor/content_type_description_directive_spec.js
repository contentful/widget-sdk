'use strict';

describe('The contentTypeDescription directive', function () {

  var container, scope;
  var compileElement;

  beforeEach(function () {
    module('contentful/test');

    inject(function ($rootScope, $compile) {
      scope = $rootScope.$new();

      compileElement = function () {
        container = $('<div class="content-type-description"></div>');
        $compile(container)(scope);
        scope.$digest();
      };
    });
  });

  afterEach(function () {
    container.remove();
  });

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
