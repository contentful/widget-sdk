'use strict';

describe('The ApiKey list directive', function () {

  var container, sidebar, accessChecker;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeDirectives('relative', 'cfKnowledgeBase');
    });

    accessChecker = this.$inject('accessChecker');

    accessChecker.shouldDisable = sinon.stub().returns(false);

    var entityCreationController = {
      newApiKey: _.noop
    };
    var apiKeys = [
      {getId: _.constant(1), getName: function () { return 'key1'; }},
      {getId: _.constant(2), getName: function () { return 'key2'; }}
    ];
    var apiKeyController = {
      getApiKeyList: sinon.stub().resolves(apiKeys)
    };

    this.setup = function () {
      container = this.$compile('<cf-api-key-list />', {
        context: {},
        entityCreationController: entityCreationController,
        apiKeyController: apiKeyController
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
    var list = container.find('.api-key-list');
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
