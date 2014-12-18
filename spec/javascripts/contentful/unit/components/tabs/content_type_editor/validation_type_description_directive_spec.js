'use strict';

describe('The validationTypeDescription directive', function () {

  var container, scope;
  var compileElement;

  beforeEach(function () {
    module('contentful/test');

    inject(function ($rootScope, $compile) {
      scope = $rootScope.$new();

      compileElement = function () {
        container = $('<div class="validation-type-description"></div>');
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
      scope.validationType = sinon.stub();
      scope.validationType.returns(type);
      compileElement();
      expect(container.find('h3').get(0)).toBeDefined();
    });
  }

  _.each([
    'in',
    'regexp',
    'size',
    'range',
    'linkContentType',
    'linkMimetypeGroup'
  ], makeDescriptionTest);

});
