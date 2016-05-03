'use strict';

describe('apiContentModel Controller', function () {

  var scope, spaceContext, accessChecker;

  beforeEach(function () {
    spaceContext = {
      refreshContentTypes: sinon.stub(),
      getFilteredAndSortedContentTypes: sinon.stub()
    };
    accessChecker = {
      wasForbidden: sinon.stub()
    };

    module('contentful/test', function ($provide) {
      $provide.value('accessChecker', accessChecker);
      $provide.value('spaceContext', spaceContext);

    });

    var $rootScope = this.$inject('$rootScope');
    var $controller = this.$inject('$controller');

    this.makeContentType = function (id) {
      return {
        getId: function () {
          return id;
        }
      };
    };

    this.setup = function () {
      spaceContext.refreshContentTypes.resolves();
      accessChecker.wasForbidden.resolves(false);
      scope = $rootScope.$new();
      $controller('apiContentModelController', {$scope: scope});
      scope.$apply();
    };
  });

  afterEach(function () {
    spaceContext = accessChecker = null;
  });

  it('displays content types', function () {
    spaceContext.getFilteredAndSortedContentTypes
      .returns([this.makeContentType('foo'), this.makeContentType('bar')]);
    this.setup();
    expect(scope.contentTypes.length).toBe(2);
  });

  it('displays empty state if there are no content types', function () {
    spaceContext.getFilteredAndSortedContentTypes.returns([]);
    this.setup();
    expect(scope.contentTypes.length).toBe(0);
  });
});
