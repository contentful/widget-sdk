'use strict';

describe('Displayed Fields Controller', () => {
  beforeEach(function() {
    module('contentful/test');

    this.mockService('systemFields', {
      getList: sinon.stub().returns([]),
      getDefaultFieldIds: () => [1, 2, 3]
    });

    this.spaceContext = this.$inject('mocks/spaceContext').init();

    this.scope = this.$inject('$rootScope').$new();

    Object.assign(this.scope, {
      context: { view: {} }
    });

    const $controller = this.$inject('$controller');
    $controller('DisplayedFieldsController', { $scope: this.scope });
  });

  describe('refreshes displayed fields', () => {
    beforeEach(function() {
      this.scope.context.view.displayedFieldIds = ['id1', 'id2', 'id5', 'display1'];
      this.scope.context.view.contentTypeId = 'ct1';
      this.spaceContext.publishedCTs.get.returns({
        data: {
          displayField: 'display1',
          fields: [
            { id: 'id1' },
            { id: 'id2' },
            { id: 'id3', disabled: true },
            { id: 'id4' },
            { id: 'display1' }
          ]
        }
      });
      this.scope.refreshDisplayFields();
    });

    it('gets display fields', function() {
      expect(this.scope.displayedFields).toEqual([{ id: 'id1' }, { id: 'id2' }]);
    });

    it('gets hidden fields', function() {
      expect(this.scope.hiddenFields).toEqual([{ id: 'id4' }]);
    });

    it('cleans unexistent fields from displayed field ids', function() {
      expect(this.scope.context.view.displayedFieldIds).toEqual(['id1', 'id2']);
    });
  });

  it('resets display fields', function() {
    this.scope.context.view.displayedFieldIds = [];
    this.scope.resetDisplayFields();
    expect(this.scope.context.view.displayedFieldIds).toEqual([1, 2, 3]);
  });

  it('adds a displayed field', function() {
    this.scope.context.view.displayedFieldIds = [];
    this.scope.addDisplayField({ id: '123' });
    expect(this.scope.context.view.displayedFieldIds).toEqual(['123']);
  });

  it('removes a displayed field', function() {
    this.scope.context.view.displayedFieldIds = ['123'];
    this.scope.removeDisplayField({ id: '123' });
    expect(this.scope.context.view.displayedFieldIds).toEqual([]);
  });
});
