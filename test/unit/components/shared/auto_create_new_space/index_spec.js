import * as sinon from 'helpers/sinon';
import * as K from 'helpers/mocks/kefir';

describe('AutoCreateNewSpace/index', function () {
  beforeEach(function () {
    this.tokenStore = {
      user$: K.createMockProperty(null),
      spacesByOrganization$: K.createMockProperty(null)
    };
    this.createSampleSpace = sinon.stub().resolves();
    this.theStore = {
      set: sinon.stub(),
      get: sinon.stub()
    };

    module('contentful/test', $provide => {
      $provide.value('services/TokenStore', this.tokenStore);
      $provide.value('components/shared/auto_create_new_space/CreateSampleSpace', this.createSampleSpace);
      $provide.value('TheStore', this.theStore);
    });

    const init = this.$inject('components/shared/auto_create_new_space').init;

    this.user = {
      sys: {id: 'user', createdAt: (new Date()).toISOString()},
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
    this.theStore.get.returns(false);
  });

  describe('#init', function () {
    it('should be a noop when user is falsy', function () {
      this.tokenStore.spacesByOrganization$.set({
        'org': ['space']
      });
      this.tokenStore.user$.set(null);
      this.init();
      sinon.assert.notCalled(this.createSampleSpace);
    });

    it('should be a noop when spacesByOrg is falsy', function () {
      this.tokenStore.user$.set({});
      this.tokenStore.spacesByOrganization$.set(null);
      this.init();
      sinon.assert.notCalled(this.createSampleSpace);
    });

    describe('qualifyUser', function () {
      // specs
      [
        [ctx => ctx.theStore.get.returns(true), 'space was already auto created for the user'],
        [ctx => (ctx.user.sys.createdAt = (new Date(2017, 7, 12)).toISOString()), 'user is not recent'],
        [ctx => ctx.tokenStore.spacesByOrganization$.set({orgId: ['spaceId']}), 'the user has an org with spaces'],
        [ctx => {
          ctx.user.organizationMemberships[0].role = 'potato';
          ctx.tokenStore.user$.set(ctx.user);
        }, 'the user does not own any orgs']
      ].forEach(testQualification);

      function testQualification ([fn, msg]) {
        it(`should be a noop if ${msg}`, function () {
          fn(this);
          this.init();
          sinon.assert.notCalled(this.createSampleSpace);
        });
      }
    });

    it('should create a sample space when the user is qualified', function () {
      this.tokenStore.spacesByOrganization$.set(this.spacesByOrg);
      this.tokenStore.user$.set(this.user);
      this.theStore.get.returns(false);
      this.init();
      sinon.assert.calledOnce(this.createSampleSpace);
      sinon.assert.calledWithExactly(
        this.createSampleSpace,
        this.user.organizationMemberships[0].organization,
        'product catalogue'
      );
    });

    it('should only call create sample space function once even if invoked multiple times', function () {
      // to prevent this.createSampleSpace from resolving before
      // the next user$ and spacesByOrganization$ values are emitted
      const delayedPromise = new Promise(resolve => setTimeout(resolve, 5000));

      this.createSampleSpace.resolves(delayedPromise);
      this.init();
      this.user.sys = { id: '123', createdAt: (new Date(2017, 8, 24)).toISOString() };
      this.tokenStore.user$.set(this.user);
      this.$apply();
      sinon.assert.calledOnce(this.createSampleSpace);
    });
  });
});
