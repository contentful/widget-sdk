'use strict';

describe('Displayed Fields Controller', function () {
  var scope;
  var stubs;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
      ]);
    });
    inject(function ($rootScope, $controller, cfStub) {
      scope = $rootScope.$new();

      scope.tab = {
        params: {
          view: {}
        }
      };

      scope.systemFields = [];

      var space = cfStub.space('test');
      var contentTypeData = cfStub.contentTypeData('testType');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);

      $controller('DisplayedFieldsController', {$scope: scope});
    });
  });

  describe('refreshes displayed fields', function() {
    beforeEach(function() {
      scope.tab.params.view.displayedFieldIds = ['id1', 'id2', 'id5', 'display1'];
      scope.tab.params.view.contentTypeId = 'ct1';
      scope.spaceContext.getPublishedContentType = sinon.stub();
      scope.spaceContext.getPublishedContentType.returns({
        data: {
          displayField: 'display1',
          fields: [
            {id: 'id1'},
            {id: 'id2'},
            {id: 'id3', disabled: true},
            {id: 'id4'},
            {id: 'display1'}
          ]
        }
      });
      scope.refreshDisplayFields();
    });

    it('gets display fields', function() {
      expect(scope.displayedFields).toEqual([
        {id: 'id1'}, {id: 'id2'}
      ]);
    });

    it('gets hidden fields', function() {
      expect(scope.hiddenFields).toEqual([
        {id: 'id4'}
      ]);
    });

    it('cleans unexistent fields from displayed field ids', function() {
      expect(scope.tab.params.view.displayedFieldIds).toEqual(['id1', 'id2']);
    });
  });

  it('resets display fields', function() {
    scope.getDefaultFieldIds = sinon.stub();
    var fieldIds = [1,2,3];
    scope.getDefaultFieldIds.returns(fieldIds);
    scope.resetDisplayFields();
    expect(scope.tab.params.view.displayedFieldIds).toEqual(fieldIds);
  });

  it('adds a displayed field', function() {
    scope.tab.params.view.displayedFieldIds = [];
    scope.addDisplayField({id: '123'});
    expect(scope.tab.params.view.displayedFieldIds).toEqual(['123']);
  });

  it('removes a displayed field', function() {
    scope.tab.params.view.displayedFieldIds = ['123'];
    scope.removeDisplayField({id: '123'});
    expect(scope.tab.params.view.displayedFieldIds).toEqual([]);
  });

});
