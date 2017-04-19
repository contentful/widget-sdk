import * as sinon from 'helpers/sinon';
import * as DOM from 'helpers/DOM';

describe('app/api/CMATokens/CreateDialog', function () {
  beforeEach(function () {
    module('contentful/test');

    const auth = {
      getToken: sinon.stub().resolves('TOKEN')
    };

    const openDialog = this.$inject('app/api/CMATokens/CreateDialog').default;
    this.open = function () {
      openDialog(auth);
    };

    this.containerEl = $('<div class=client>').appendTo('body').get(0);
    this.container = DOM.createView(this.containerEl);

    const Config = this.$inject('Config');
    const $http = this.$inject('$httpBackend');
    this.postTokenHandler = $http.whenPOST(Config.apiUrl('users/me/access_tokens'));
    this.postTokenHandler.respond(200, {sys: {}, token: 't0ken'});
  });

  afterEach(function () {
    $(this.container).remove();
  });

  it('succesfully generates and displays token', function* () {
    this.open();
    this.container.find('pat.create.tokenName').setValue('TOKEN NAME');
    this.container.find('pat.create.generate').click();
    this.$flush();
    this.container.find('pat.create.tokenCopy').assertValue('t0ken');
  });

  it('shows an error message when empty name is provided', function* () {
    this.open();
    const nameInput = this.container.find('pat.create.tokenName');
    nameInput.setValue('  ');
    this.container.find('pat.create.generate').click();
    this.$apply();
    nameInput.assertValid(false);
  });

  it('asks to retry if generation fails', function () {
    this.postTokenHandler.respond(500);
    this.open();
    this.container.find('pat.create.tokenName').setValue('TOKEN NAME');
    this.container.find('pat.create.generate').click();
    this.$flush();
    this.container.find('pat.create.tokenGenerationFailed').assertIsAlert();
  });
});
