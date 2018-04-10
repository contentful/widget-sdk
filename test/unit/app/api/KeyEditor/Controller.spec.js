import ReactTestUtils from 'react-dom/test-utils';

describe('app/api/KeyEditor/Controller', function () {
  beforeEach(function () {
    module('contentful/test', ($provide) => {
      $provide.value('navigation/closeState', sinon.spy());
      $provide.value('app/api/KeyEditor/BoilerplateCode', {
        get: sinon.stub().resolves([
          {id: 'BP_ID', instructions: '', sourceUrl: sinon.stub().returns('https://downloadlink')}
        ])
      });
    });

    const attachController = this.$inject('app/api/KeyEditor/Controller').default;
    const template = this.$inject('app/api/KeyEditor/Template').default();
    const { renderString } = this.$inject('ui/Framework');
    const $compile = this.$inject('$compile');
    const $rootScope = this.$inject('$rootScope');
    const $state = this.$inject('$state');

    sinon.stub($state, 'go').resolves();

    this.accessChecker = this.$inject('access_control/AccessChecker');
    this.accessChecker.canModifyApiKeys = sinon.stub().returns(true);

    this.spaceContext = this.$inject('mocks/spaceContext').init();
    this.apiKeyRepo = this.spaceContext.apiKeyRepo;

    this.compile = function (apiKey) {
      apiKey = _.assign({
        sys: {
          id: 'KEY_ID'
        },
        name: 'NAME',
        accessToken: 'DELIVERY_TOKEN',
        preview_api_key: {
          accessToken: 'PREVIEW_TOKEN'
        }
      }, apiKey);

      const scope = $rootScope.$new();
      scope.context = {};
      attachController(scope, apiKey);
      const el = $compile(renderString(template))(scope).get(0);
      scope.$apply();
      return {
        input: {
          name: findInput(el, 'name'),
          spaceId: findInput(el, 'space-id'),
          deliveryToken: findInput(el, 'delivery-token'),
          previewToken: findInput(el, 'preview-token')
        },
        actions: {
          delete: () => findButton(el, 'apiKey.delete'),
          deleteConfirm: () => findButton(el, 'apiKey.deleteConfirm'),
          save: () => findButton(el, 'apiKey.save')
        }
      };
    };
  });

  it('initializes input values', function () {
    this.spaceContext.getId.returns('SPACE_ID');
    const editor = this.compile();
    expect(editor.input.name.value).toBe('NAME');
    expect(editor.input.spaceId.value).toBe('SPACE_ID');
    expect(editor.input.deliveryToken.value).toBe('DELIVERY_TOKEN');
    expect(editor.input.previewToken.value).toBe('PREVIEW_TOKEN');
  });

  describe('delete action', function () {
    it('removes api key from repo', function () {
      const $state = this.$inject('$state');
      this.apiKeyRepo.remove = sinon.stub().resolves();

      const editor = this.compile();
      editor.actions.deleteConfirm().click();

      sinon.assert.calledWith(this.apiKeyRepo.remove, 'KEY_ID');
      sinon.assert.calledWith($state.go, 'spaces.detail.api.keys.list');
    });
  });

  describe('save action', function () {
    it('saves key to repo', function () {
      this.apiKeyRepo.save = sinon.spy((data) => {
        return this.$inject('$q').resolve(data);
      });

      const editor = this.compile();

      editor.input.name.value = 'NEW NAME';
      ReactTestUtils.Simulate.change(editor.input.name);
      this.$apply();

      editor.actions.save().click();
      sinon.assert.calledWith(this.apiKeyRepo.save, sinon.match({
        sys: {
          id: 'KEY_ID'
        },
        name: 'NEW NAME'
      }));
    });
  });

  function findInput (el, name) {
    return el.querySelectorAll(`input[name="${name}"]`)[0];
  }

  function findButton (el, testId) {
    return el.querySelectorAll(`button[data-test-id="${testId}"]`)[0];
  }
});
