import * as sinon from 'helpers/sinon';
import {cloneDeep} from 'lodash';

describe('Enforcements Service', function () {
  beforeEach(function () {
    this.fetchEnforcements = sinon.stub().resolves([]);

    module('contentful/test', ($provide) => {
      $provide.value('data/EndpointFactory', {
        createSpaceEndpoint: () => this.fetchEnforcements
      });
    });
    this.EnforcementsService = this.$inject('services/EnforcementsService');

    this.setEnforcementsResp = (enforcements) => {
      this.fetchEnforcements.resolves({ items: enforcements });
    };
  });

  it('is initialized with enforcements not defined', function () {
    expect(this.EnforcementsService.getEnforcements()).toBeUndefined();
  });

  it('fetches enforcements when requested', async function () {
    const enforcements = [ {} ];
    this.setEnforcementsResp(enforcements);
    await this.EnforcementsService.refresh('SPACE_ID');

    expect(this.fetchEnforcements.callCount).toBe(1);
    expect(this.EnforcementsService.getEnforcements()).toBe(enforcements);
  });

  it('returns the same enforcements object if it has not been changed remotely', async function () {
    const enforcements = [ { sys: {id: 'E_1'} } ];

    this.setEnforcementsResp(enforcements);
    await this.EnforcementsService.refresh('SPACE_ID');
    const first = this.EnforcementsService.getEnforcements();

    this.setEnforcementsResp(cloneDeep(enforcements));
    await this.EnforcementsService.refresh('SPACE_ID');
    const second = this.EnforcementsService.getEnforcements();

    expect(first).toBe(enforcements);
    expect(second).toBe(first);
  });

  it('returns new enforcements if they were changed remotely', async function () {
    const enforcements = [ { sys: {id: 'E_1'} } ];
    this.setEnforcementsResp(enforcements);
    await this.EnforcementsService.refresh('SPACE_ID');
    const first = this.EnforcementsService.getEnforcements();

    const newEnforcements = [];
    this.setEnforcementsResp(newEnforcements);
    await this.EnforcementsService.refresh('SPACE_ID');
    const second = this.EnforcementsService.getEnforcements();

    expect(first).toBe(enforcements);
    expect(second).toBe(newEnforcements);
  });

  describe('periodically refreshes enforcements', function () {
    beforeEach(function () {
      this.setInterval = window.setInterval.bind(window);

      window.setInterval = (fn) => this.setInterval(fn, 10);

      this.wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    });

    afterEach(function () {
      window.setInterval = this.setInterval;
    });

    it('re-fetches enforcements after a timeout', async function () {
      const deinit = this.EnforcementsService.init('SPACE_ID');
      await this.wait(15);
      expect(this.fetchEnforcements.callCount).toBe(2);

      deinit();
    });
  });
});
