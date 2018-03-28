import { createIsolatedSystem } from 'test/helpers/system-js';

describe('NumberUtils', function () {
  beforeEach(function* () {
    const system = createIsolatedSystem();
    this.NumberUtils = yield system.import('utils/NumberUtils');
  });

  describe('shorten', function () {
    let shorten;

    beforeEach(function () {
      shorten = this.NumberUtils.shorten;
    });

    it('does not change numbers lower than 1000', function () {
      expect(shorten(999)).toEqual(999);
    });

    it('shortens in thousands', function () {
      expect(shorten(1e3)).toEqual('1K');
      expect(shorten(1e4)).toEqual('10K');
      expect(shorten(1e5)).toEqual('100K');
    });

    it('shortens thousands with up to two decimal places', function () {
      expect(shorten(2550)).toEqual('2.55K');
      expect(shorten(25550)).toEqual('25.55K');
      expect(shorten(255550)).toEqual('255.55K');
    });

    it('shortens in millions', function () {
      expect(shorten(1e6)).toEqual('1M');
      expect(shorten(1e7)).toEqual('10M');
      expect(shorten(1e8)).toEqual('100M');
    });

    it('shortens millions with up to two decimal places', function () {
      expect(shorten(2550000)).toEqual('2.55M');
      expect(shorten(25550000)).toEqual('25.55M');
      expect(shorten(255550000)).toEqual('255.55M');
    });

    it('removes unnecessary decimal places', function () {
      expect(shorten(2500)).toEqual('2.5K');
      expect(shorten(2500000)).toEqual('2.5M');
    });
  });
});
