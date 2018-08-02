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

  describe('getEnforcements', function () {
    it('should return null if given no space id', function () {
      expect(this.EnforcementsService.getEnforcements()).toBe(null);
    });

    it('should return null if given a space id for which no enforcements exist', function () {
      expect(this.EnforcementsService.getEnforcements('BAD_SPACE_ID')).toBe(null);
    });

    it('fetches enforcements for a given space id when requested', async function () {
      const enforcements = [ {} ];
      this.setEnforcementsResp(enforcements);
      await this.EnforcementsService.refresh('SPACE_ID');

      expect(this.fetchEnforcements.callCount).toBe(1);
      expect(this.EnforcementsService.getEnforcements('SPACE_ID')).toBe(enforcements);
      expect(this.EnforcementsService.getEnforcements('SPACE_ID_2')).toBe(null);
    });

    it('returns the same enforcements object if it has not been changed remotely', async function () {
      const enforcements = [ { sys: {id: 'E_1'} } ];

      this.setEnforcementsResp(enforcements);
      await this.EnforcementsService.refresh('SPACE_ID');
      const first = this.EnforcementsService.getEnforcements('SPACE_ID');

      this.setEnforcementsResp(cloneDeep(enforcements));
      await this.EnforcementsService.refresh('SPACE_ID');
      const second = this.EnforcementsService.getEnforcements('SPACE_ID');

      expect(first).toBe(enforcements);
      expect(second).toBe(first);
    });

    it('returns new enforcements if they were changed remotely', async function () {
      const enforcements = [ { sys: {id: 'E_1'} } ];
      this.setEnforcementsResp(enforcements);
      await this.EnforcementsService.refresh('SPACE_ID');
      const first = this.EnforcementsService.getEnforcements('SPACE_ID');

      const newEnforcements = [];
      this.setEnforcementsResp(newEnforcements);
      await this.EnforcementsService.refresh('SPACE_ID');
      const second = this.EnforcementsService.getEnforcements('SPACE_ID');

      expect(first).toBe(enforcements);
      expect(second).toBe(newEnforcements);
    });
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

    it('should remove any enforcements when deinitialized', async function () {
      const enforcements = [ { sys: {id: 'E_1'} } ];
      this.setEnforcementsResp(enforcements);

      const deinit = this.EnforcementsService.init('SPACE_ID');
      await this.wait(15);

      expect(this.EnforcementsService.getEnforcements('SPACE_ID')).toEqual(enforcements);
      deinit();
      expect(this.EnforcementsService.getEnforcements('SPACE_ID')).toEqual(null);
    });
  });
});
