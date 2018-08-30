import * as sinon from 'helpers/sinon';
import * as K from 'helpers/mocks/kefir';

describe('AutoCreateNewSpace/index', () => {
  beforeEach(function() {
    this.tokenStore = {
      user$: K.createMockProperty(null),
      spacesByOrganization$: K.createMockProperty(null),
      organizations$: K.createMockProperty([])
    };
    this.createSampleSpace = sinon.stub().resolves();
    this.store = {
      set: sinon.stub(),
      get: sinon.stub(),
      forKey: sinon.stub()
    };

    module('contentful/test', $provide => {
      $provide.value('services/TokenStore.es6', this.tokenStore);
      $provide.value(
        'components/shared/auto_create_new_space/CreateSampleSpace.es6',
        this.createSampleSpace
      );
      $provide.value('TheStore', {
        getStore: sinon.stub().returns(this.store)
      });
      $provide.value('utils/LaunchDarkly', {
        getCurrentVariation: sinon.stub().returns(false)
      });
    });

    const init = this.$inject('components/shared/auto_create_new_space').init;

    this.user = {
      sys: { id: 'user', createdAt: new Date().toISOString() },
      organizationMemberships: [
        {
          role: 'owner',
          organization: {
            sys: { id: 'orgId1' }
          }
        },
        {
          role: 'admin',
          organization: {
            sys: { id: 'orgId2' }
          }
        }
      ]
    };
    this.spacesByOrg = {};

    this.init = _ => {
      init();
      this.$apply();
    };

    // set data to qualify user
    this.tokenStore.spacesByOrganization$.set(this.spacesByOrg);
    this.tokenStore.user$.set(this.user);
    this.store.get.returns(false);
  });

  describe('#init', () => {
    it('should be a noop when user is falsy', function() {
      this.tokenStore.organizations$.set([{ sys: { id: 'org' } }]);
      this.tokenStore.spacesByOrganization$.set({
        org: ['space']
      });
      this.tokenStore.user$.set(null);
      this.init();
      sinon.assert.notCalled(this.createSampleSpace);
    });

    it('should be a noop when spacesByOrg is falsy', function() {
      this.tokenStore.user$.set({});
      this.tokenStore.spacesByOrganization$.set(null);
      this.init();
      sinon.assert.notCalled(this.createSampleSpace);
    });

    describe('qualifyUser', () => {
      // specs
      [
        [ctx => ctx.store.get.returns(true), 'space was already auto created for the user'],
        [
          ctx => (ctx.user.sys.createdAt = new Date(2017, 7, 12).toISOString()),
          'user is not recent'
        ],
        [
          ctx => ctx.tokenStore.spacesByOrganization$.set({ orgId: ['spaceId'] }),
          'the user has an org with spaces'
        ],
        [
          ctx => {
            ctx.user.organizationMemberships[0].role = 'potato';
            ctx.tokenStore.user$.set(ctx.user);
          },
          'the user does not own any orgs'
        ]
      ].forEach(testQualification);

      function testQualification([fn, msg]) {
        it(`should be a noop if ${msg}`, function() {
          fn(this);
          this.init();
          sinon.assert.notCalled(this.createSampleSpace);
        });
      }
    });

    it('should create a sample space when the user is qualified', async function() {
      this.tokenStore.spacesByOrganization$.set(this.spacesByOrg);
      this.tokenStore.user$.set(this.user);
      this.store.get.returns(false);
      this.init();
      await new Promise(resolve => setTimeout(resolve, 0));
      sinon.assert.calledOnce(this.createSampleSpace);
      sinon.assert.calledWithExactly(
        this.createSampleSpace,
        this.user.organizationMemberships[0].organization,
        'the example app',
        undefined
      );
    });

    it('should only call create sample space function once even if invoked multiple times', async function() {
      // to prevent this.createSampleSpace from resolving before
      // the next user$ and spacesByOrganization$ values are emitted
      const delayedPromise = new Promise(resolve => setTimeout(resolve, 5000));

      this.createSampleSpace.resolves(delayedPromise);
      this.init();
      await new Promise(resolve => setTimeout(resolve, 0));
      this.user.sys = { id: '123', createdAt: new Date(2017, 8, 24).toISOString() };
      this.tokenStore.user$.set(this.user);
      this.$apply();
      sinon.assert.calledOnce(this.createSampleSpace);
    });
  });
});
