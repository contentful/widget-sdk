import * as sinon from 'helpers/sinon';
import {cloneDeep} from 'lodash';

describe('Enforcements', () => {
  beforeEach(function () {
    this.fetchEnforcements = sinon.stub().resolves([]);

    module('contentful/test', ($provide) => {
      $provide.value('Authentication', {});
      $provide.value('data/CMA/EnforcementsInfo', {
        default: () => this.fetchEnforcements
      });
    });
    this.Enforcements = this.$inject('services/Enforcements');
  });

  afterEach(function () {
    this.Enforcements.stopRefreshing();
  });

  it('is initialized with enforcements not defined', function () {
    expect(this.Enforcements.getEnforcements()).toBeUndefined();
  });

  it('fetches enforcements for given space id', async function () {
    const enforcements = [{}];
    this.fetchEnforcements.withArgs('SPACE_ID').resolves(enforcements);
    await this.Enforcements.refresh('SPACE_ID');

    expect(this.Enforcements.getEnforcements()).toBe(enforcements);
  });

  it('returns the same enforcements object if it has not been changed remotely', async function () {
    const enforcements = [{sys: {id: 'E_1'}}];
    this.fetchEnforcements.resolves(enforcements);
    await this.Enforcements.refresh('SPACE_ID');
    const first = this.Enforcements.getEnforcements();

    this.fetchEnforcements.resolves(cloneDeep(enforcements));
    await this.Enforcements.refresh('SPACE_ID');
    const second = this.Enforcements.getEnforcements();

    expect(first).toBe(enforcements);
    expect(second).toBe(first);
  });

  it('returns new enforcements if they were changed remotely', async function () {
    const enforcements = [{sys: {id: 'E_1'}}];
    this.fetchEnforcements.resolves(enforcements);
    await this.Enforcements.refresh('SPACE_ID');
    const first = this.Enforcements.getEnforcements();

    const newEnforcements = [];
    this.fetchEnforcements.resolves(newEnforcements);
    await this.Enforcements.refresh('SPACE_ID');
    const second = this.Enforcements.getEnforcements();

    expect(first).toBe(enforcements);
    expect(second).toBe(newEnforcements);
  });

  describe('periodically refreshes enforcements', function () {
    beforeEach(function () {
      this.setTimeout = window.setTimeout.bind(window);
      window.setTimeout = (fn) => this.setTimeout(fn, 10);
      this.wait = (ms) => new Promise(resolve => { this.setTimeout(resolve, ms); });
    });

    afterEach(function () {
      window.setTimeout = this.setTimeout;
    });

    it('re-fetches enforcements after a timeout', async function () {
      await this.Enforcements.refresh('SPACE_ID');
      await this.wait(20);
      sinon.assert.calledTwice(this.fetchEnforcements);
    });

    it('re-fetches with correct space id after space change', async function () {
      await this.Enforcements.refresh('SPACE_1');
      await this.Enforcements.refresh('SPACE_2');
      await this.wait(20);
      sinon.assert.calledOnce(this.fetchEnforcements.withArgs('SPACE_1'));
      sinon.assert.calledTwice(this.fetchEnforcements.withArgs('SPACE_2'));
    });
  });
});
