import { createIsolatedSystem } from 'test/helpers/system-js';

describe('account/pricing/PricingDataProvider.es6', () => {
  beforeEach(function() {
    module('contentful/test');
    this.PricingDataProvider = this.$inject('account/pricing/PricingDataProvider.es6');
  });

  describe('#getPlansWithSpaces()', () => {
    beforeEach(function() {
      this.baseRatePlanChargeData = {
        items: [
          {
            productType: 'committed'
          }
        ]
      };
      this.spacePlansData = {
        items: [
          { sys: { id: 'plan1' }, gatekeeperKey: 'space1' },
          { sys: { id: 'plan2' }, gatekeeperKey: 'space2' },
          { sys: { id: 'plan3' }, gatekeeperKey: 'space3' },
          { sys: { id: 'plan4' } }
        ]
      };
      this.spacesData = {
        items: [
          { sys: { id: 'space1', createdBy: { sys: { id: 'user1' } } } },
          { sys: { id: 'space2', createdBy: { sys: { id: 'user2' } } } },
          { sys: { id: 'space3', createdBy: { sys: { id: 'user1' } } } },
          { sys: { id: 'free_space', createdBy: { sys: { id: 'free_space_user' } } } }
        ]
      };
      this.usersData = { items: [{ sys: { id: 'user1' }, email: 'user1@foo.com' }] };

      this.endpoint = sinon.stub().resolves();
      this.endpoint
        .withArgs(sinon.match({ path: ['plans'] }), sinon.match.any)
        .resolves(this.spacePlansData);
      this.endpoint
        .withArgs(sinon.match({ query: { plan_type: 'base' } }), sinon.match.any)
        .resolves(this.baseRatePlanChargeData);
      this.endpoint.withArgs(sinon.match({ path: ['spaces'] })).resolves(this.spacesData);
      this.endpoint.withArgs(sinon.match({ path: ['users'] })).resolves(this.usersData);

      this.getPlansWithSpaces = () => this.PricingDataProvider.getPlansWithSpaces(this.endpoint);
      this.expectSpacePlan = (plan, id, spaceId, email) => {
        expect(plan.sys.id).toBe(id);
        if (spaceId) {
          expect(plan.space).toBeDefined();
          expect(plan.space.sys.id).toBe(spaceId);
          if (email) {
            expect(plan.space.sys.createdBy).toBeDefined();
            expect(plan.space.sys.createdBy.email).toBe(email);
          } else {
            expect(plan.space.sys.createdBy).toBeUndefined();
          }
        } else {
          expect(plan.space).toBeUndefined();
        }
      };
    });

    it('parses response data and sets spaces and users', function*() {
      const plans = yield this.getPlansWithSpaces();

      expect(plans.items.length).toBe(5);
      this.expectSpacePlan(plans.items[0], 'plan1', 'space1', 'user1@foo.com');
      this.expectSpacePlan(plans.items[1], 'plan2', 'space2', null);
      this.expectSpacePlan(plans.items[2], 'plan3', 'space3', 'user1@foo.com');
      this.expectSpacePlan(plans.items[3], 'plan4', null, null);
      this.expectSpacePlan(plans.items[4], 'free-space-plan-1', 'free_space', null);
    });

    it('fetches all spaces', function*() {
      const fetchAll = sinon.stub().resolves(this.spacesData.items);

      // Create an isolated system to mock fetchAll()
      const system = createIsolatedSystem();
      system.set('data/Endpoint.es6', {});

      // Mocks for angular services in the dependencies tree, will get 'Not found'
      // errors if they are not set explicitly.
      // TODO: provide them in isolated system's AngularSystem.
      system.set('$location', {});
      system.set('utils/ngCompat/window.es6', { default: {} });
      system.set('$http', {});

      system.set('data/CMA/FetchAll.es6', { fetchAll });

      const PricingDataProvider = yield system.import('account/pricing/PricingDataProvider.es6');

      yield PricingDataProvider.getPlansWithSpaces(this.endpoint);
      sinon.assert.calledWith(fetchAll, this.endpoint, ['spaces']);
    });

    it('passes unique user ids to users endpoint', function*() {
      yield this.getPlansWithSpaces();
      sinon.assert.calledWith(this.endpoint, {
        method: 'GET',
        path: ['users'],
        query: { 'sys.id': 'user1,user2,free_space_user' }
      });
    });
  });

  describe('#isSelfServicePlan', () => {
    it('should return true for customer type "Self-service"', function() {
      const plan = {
        customerType: 'Self-service'
      };

      expect(this.PricingDataProvider.isSelfServicePlan(plan)).toBe(true);
    });
  });

  describe('#isEnterprisePlan', () => {
    it('should return true for customer type "Enterprise"', function() {
      const plan = {
        customerType: 'Enterprise'
      };

      expect(this.PricingDataProvider.isEnterprisePlan(plan)).toBe(true);
    });

    it('should return true for customer type "Enterprise Trial"', function() {
      const plan = {
        customerType: 'Enterprise Trial'
      };

      expect(this.PricingDataProvider.isEnterprisePlan(plan)).toBe(true);
    });
  });
});
