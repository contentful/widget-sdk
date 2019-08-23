import ReactTestUtils from 'react-dom/test-utils';
import _ from 'lodash';
import sinon from 'sinon';
import { $initialize, $inject, $apply } from 'test/helpers/helpers';

describe('app/api/KeyEditor/Controller.es6', () => {
  beforeEach(async function() {
    this.system.set('app/api/KeyEditor/BoilerplateCode.es6', {
      get: sinon.stub().resolves([
        {
          id: 'BP_ID',
          instructions: '',
          sourceUrl: sinon.stub().returns('https://downloadlink')
        }
      ])
    });

    this.system.set('access_control/AccessChecker/index.es6', {
      canModifyApiKeys: sinon.stub().returns(true),
      shouldDisable: sinon.stub()
    });

    const attachController = (await this.system.import('app/api/KeyEditor/Controller.es6')).default;
    const template = (await this.system.import('app/api/KeyEditor/Template.es6')).default();

    module('contentful/test', $provide => {
      $provide.value('navigation/closeState', sinon.spy());
    });

    await $initialize();

    const $compile = $inject('$compile');
    const $rootScope = $inject('$rootScope');
    const $state = $inject('$state');

    sinon.stub($state, 'go').resolves();

    this.spaceContext = $inject('mocks/spaceContext').init();
    this.apiKeyRepo = this.spaceContext.apiKeyRepo;

    this.compile = apiKey => {
      apiKey = _.assign(
        {
          sys: {
            id: 'KEY_ID'
          },
          name: 'NAME',
          accessToken: 'DELIVERY_TOKEN',
          preview_api_key: {
            accessToken: 'PREVIEW_TOKEN'
          }
        },
        apiKey
      );

      const scope = $rootScope.$new();
      scope.context = {};
      attachController(scope, apiKey);
      const el = $compile(template)(scope).get(0);
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

  it('initializes input values', function() {
    this.spaceContext.getId.returns('SPACE_ID');
    const editor = this.compile();
    expect(editor.input.name.value).toBe('NAME');
    expect(editor.input.spaceId.value).toBe('SPACE_ID');
    expect(editor.input.deliveryToken.value).toBe('DELIVERY_TOKEN');
    expect(editor.input.previewToken.value).toBe('PREVIEW_TOKEN');
  });

  describe('delete action', () => {
    it('removes api key from repo', function() {
      const $state = $inject('$state');
      this.apiKeyRepo.remove = sinon.stub().resolves();

      const editor = this.compile();
      editor.actions.deleteConfirm().click();

      sinon.assert.calledWith(this.apiKeyRepo.remove, 'KEY_ID');
      sinon.assert.calledWith($state.go, '^.list');
    });
  });

  describe('save action', () => {
    it('saves key to repo', function() {
      this.apiKeyRepo.save = sinon.spy(data => {
        return $inject('$q').resolve(data);
      });

      const editor = this.compile();

      editor.input.name.value = 'NEW NAME';
      ReactTestUtils.Simulate.change(editor.input.name);
      $apply();

      editor.actions.save().click();
      sinon.assert.calledWith(
        this.apiKeyRepo.save,
        sinon.match({
          sys: {
            id: 'KEY_ID'
          },
          name: 'NEW NAME'
        })
      );
    });
  });

  function findInput(el, name) {
    return el.querySelectorAll(`input[name="${name}"]`)[0];
  }

  function findButton(el, testId) {
    return el.querySelectorAll(`button[data-test-id="${testId}"]`)[0];
  }
});
