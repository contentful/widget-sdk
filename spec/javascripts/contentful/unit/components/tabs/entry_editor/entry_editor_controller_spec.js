'use strict';

describe('Entry Editor Controller', function () {
  var controller, scope;
  beforeEach(module('contentful/test'));

  beforeEach(inject(function ($compile, $rootScope, $controller){
    scope = $rootScope;
    var locale = {
      code: 'en-US',
      contentDeliveryApi: true,
      contentManagementApi: true,
      'default': true,
      name: 'en-US',
      publish: true
    };
    var contentType = {
      data: {
        fields: []
      }
    };
    var entry = {
      data: {
        fields: {},
        sys: {publishedVersion: 1}
      },
      isArchived: sinon.stub().returns(false)
    };
    scope.spaceContext = {
      activeLocales: sinon.stub().returns([locale]),
      publishedTypeForEntry: sinon.stub().returns(contentType),
      space: {
        getPublishLocales: sinon.stub().returns([locale])
      }
    };
    scope.tab = {
      params: {
        entry: entry
      }
    };
    controller = $controller('EntryEditorCtrl', {$scope: $rootScope});
    scope.$digest();
  }));

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('should validate if the published version has changed', function () {
    scope.validate = sinon.spy();
    scope.entry.data.sys.publishedVersion = 2;
    scope.$digest();
    expect(scope.validate.called).toBe(true);
  });
});

