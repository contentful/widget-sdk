import * as sinon from 'test/helpers/sinon';
import * as DOM from 'test/helpers/DOM';
import $ from 'jquery';
import attachContextMenuHandler from 'ui/ContextMenuHandler.es6';

/**
 * Acceptance tests for personal CMA tokens
 */
describe('app/api/CMATokens', () => {
  beforeEach(function() {
    module('contentful/test', $provide => {
      // TODO Fix modal dialog or immediately invoked defer.
      // The modal dialog service uses 'lodash/defer', which immediately invokes its
      // callback in the tests. This leads to a 'digest already in progress
      // error'
      $provide.factory('lodash/defer', $timeout => {
        return $timeout;
      });
      $provide.value('$state', {
        href: sinon.stub(),
        current: { name: 'test.api.foo' }
      });
    });

    // TODO build helper for HTTP mocking
    const Config = this.$inject('Config.es6');
    const $http = this.$inject('$httpBackend');
    this.listTokenHandler = sinon.stub();
    $http
      .whenRoute('GET', Config.apiUrl('users/me/access_tokens'))
      .respond((_method, _url, _data, _headers, params) => this.listTokenHandler(params));
    this.listTokenHandler.returns([
      200,
      {
        total: 1,
        items: [{ sys: { id: 'TOKEN-ID' }, name: 'TOKEN-NAME' }]
      }
    ]);
    this.revokeToken = sinon.stub().returns([200]);
    $http
      .whenRoute('PUT', Config.apiUrl('users/me/access_tokens/:token_id/revoked'))
      .respond((_method, _url, _data, _headers, params) => this.revokeToken(params.token_id));

    this.postTokenHandler = $http.whenPOST(Config.apiUrl('users/me/access_tokens'));
    this.postTokenHandler.respond(200, { sys: {}, token: 't0ken' });

    this.detachContextMenuHandler = attachContextMenuHandler(this.$inject('$document'));

    const auth = {
      getToken: sinon.stub().resolves('TOKEN')
    };

    const CMATokensPage = this.$inject('app/api/CMATokens/Page.es6');
    const CMATokensPageTemplate = this.$inject('app/api/CMATokens/PageTemplate.es6').default;

    this.init = function() {
      // TODO abstract this into DOM helper
      this.container = DOM.createView($('<div class=client>').get(0));
      $(this.container.element).appendTo('body');

      this.$compileWith(CMATokensPageTemplate(), $scope => {
        CMATokensPage.initController($scope, auth);
      }).appendTo(this.container.element);

      this.$flush();
    };
  });

  afterEach(function() {
    $(this.container.element).remove();
    this.detachContextMenuHandler();
  });

  it('successfully updates the token list with newly created one', function() {
    this.listTokenHandler.onFirstCall().returns([
      200,
      {
        total: 1,
        items: [{ sys: { id: 'TOKEN-1' }, name: 'TOKEN-1-NAME' }]
      }
    ]);
    this.listTokenHandler.onSecondCall().returns([
      200,
      {
        total: 2,
        items: [
          { sys: { id: 'TOKEN-1' }, name: 'TOKEN-1-NAME' },
          { sys: { id: 'TOKEN-2' }, name: 'TOKEN-2-NAME' }
        ]
      }
    ]);
    this.init();
    this.container.find('pat.create.open').click();
    this.$flush();
    const rowWithFirstToken = this.container.find('pat.tokenRow.TOKEN-1');
    const rowWithNewToken = this.container.find('pat.tokenRow.TOKEN-2');

    rowWithFirstToken.assertHasText('TOKEN-1-NAME');
    rowWithNewToken.assertNonExistent();

    this.container.find('pat.create.tokenName').setValue('TOKEN-2-NAME');
    this.container.find('pat.create.generate').click();
    this.$flush();

    rowWithFirstToken.assertHasText('TOKEN-1-NAME');
    rowWithNewToken.assertHasText('TOKEN-2-NAME');
  });

  describe('create dialog', () => {
    beforeEach(function() {
      this.init();
      this.container.find('pat.create.open').click();
      this.$flush();
    });

    it('succesfully generates and displays token', function*() {
      this.container.find('pat.create.tokenName').setValue('TOKEN NAME');
      this.container.find('pat.create.generate').click();
      this.$flush();
      this.container.find('pat.create.tokenCopy').assertValue('t0ken');
    });

    it('shows an error message when empty name is provided', function*() {
      const nameInput = this.container.find('pat.create.tokenName');
      nameInput.setValue('  ');
      this.container.find('pat.create.generate').click();
      this.$apply();
      nameInput.assertValid(false);
    });

    it('asks to retry if generation fails', function() {
      this.postTokenHandler.respond(500);
      this.container.find('pat.create.tokenName').setValue('TOKEN NAME');
      this.container.find('pat.create.generate').click();
      this.$flush();
      this.container.find('pat.create.tokenGenerationFailed').assertIsAlert();
    });
  });

  it('lists tokens from selected page', function() {
    this.listTokenHandler.returns([
      200,
      {
        total: 20,
        items: [
          { sys: { id: 'TOKEN-1' }, name: 'TOKEN-1-NAME' },
          { sys: { id: 'TOKEN-2' }, name: 'TOKEN-2-NAME' }
        ]
      }
    ]);
    this.init();
    this.container.find('pat.tokenRow.TOKEN-1').assertHasText('TOKEN-1-NAME');

    this.listTokenHandler.returns([
      200,
      {
        total: 20,
        items: [
          { sys: { id: 'TOKEN-6' }, name: 'TOKEN-6-NAME' },
          { sys: { id: 'TOKEN-7' }, name: 'TOKEN-7-NAME' }
        ]
      }
    ]);
    // Labales are 0-based
    this.container.find('paginator.select.1').click();
    this.$flush();
    this.container.find('pat.tokenRow.TOKEN-6').assertHasText('TOKEN-6-NAME');

    this.container.find('paginator.select.2').assertNonExistent();
  });
});
