import sinon from 'sinon';
import { $initialize, $inject } from 'test/utils/ng';

describe('Displayed Fields Controller', () => {
  beforeEach(async function () {
    this.system.set('data/SystemFields', {
      getList: sinon.stub().returns([]),
      getDefaultFieldIds: () => [1, 2, 3],
    });

    await $initialize(this.system);

    this.spaceContext = $inject('mocks/spaceContext').init();

    this.scope = $inject('$rootScope').$new();

    Object.assign(this.scope, {
      context: { view: {} },
    });

    const $controller = $inject('$controller');
    $controller('DisplayedFieldsController', { $scope: this.scope });
    sinon.spy(this.scope, 'refreshDisplayFields');
  });

  describe('refreshes displayed fields', () => {
    beforeEach(function () {
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
            { id: 'display1' },
          ],
        },
      });
      this.scope.refreshDisplayFields();
      this.scope.refreshDisplayFields.resetHistory();
    });

    it('gets display fields', function () {
      expect(this.scope.displayedFields).toEqual([{ id: 'id1' }, { id: 'id2' }]);
    });

    it('gets hidden fields', function () {
      expect(this.scope.hiddenFields).toEqual([{ id: 'id4' }]);
    });

    it('cleans unexistent fields from displayed field ids', function () {
      expect(this.scope.context.view.displayedFieldIds).toEqual(['id1', 'id2']);
    });
  });

  it('resets display fields', function () {
    this.scope.context.view.displayedFieldIds = [];
    this.scope.resetDisplayFields();
    expect(this.scope.context.view.displayedFieldIds).toEqual([1, 2, 3]);
  });

  it('adds a displayed field', function () {
    this.scope.context.view.displayedFieldIds = [];
    this.scope.addDisplayField({ id: '123' });
    expect(this.scope.context.view.displayedFieldIds).toEqual(['123']);
  });

  it('removes a displayed field', function () {
    this.scope.context.view.displayedFieldIds = ['123'];
    this.scope.removeDisplayField({ id: '123' });
    expect(this.scope.context.view.displayedFieldIds).toEqual([]);
  });

  it('removes content type from displayed fields', function () {
    this.scope.context.view.contentTypeHidden = false;
    this.scope.toggleContentType();
    expect(this.scope.context.view.contentTypeHidden).toEqual(true);
  });
});
