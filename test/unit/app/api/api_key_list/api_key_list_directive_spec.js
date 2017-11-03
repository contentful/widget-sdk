'use strict';

describe('The ApiKey list directive', function () {
  let container, sidebar, accessChecker;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeDirectives('relative', 'cfKnowledgeBase');
    });

    accessChecker = this.$inject('accessChecker');
    accessChecker.shouldDisable = sinon.stub().returns(false);

    const spaceContext = this.$inject('mocks/spaceContext').init();
    spaceContext.apiKeyRepo.getAll = sinon.stub().resolves([
      {sys: {id: 1}, name: 'key1'},
      {sys: {id: 2}, name: 'key2'}
    ]);

    this.setup = function () {
      container = this.$compile('<cf-api-key-list />', {
        context: {}
      });
      sidebar = container.find('.entity-sidebar');
    };
  });

  afterEach(function () {
    container.remove();
    container = sidebar = accessChecker = null;
  });

  it('list has 2 elements', function () {
    this.setup();
    const list = container.find('.api-key-list');
    expect(list.find('.entity-list__item').length).toBe(2);
  });

  it('save button is disabled', function () {
    accessChecker.shouldDisable.returns(true);
    this.setup();
    expect(sidebar.find('.btn-action').attr('aria-disabled')).toBe('true');
  });

  it('save button is enabled', function () {
    this.setup();
    expect(sidebar.find('.btn-action').attr('aria-disabled')).toBeUndefined();
  });
});
