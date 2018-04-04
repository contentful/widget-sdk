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

  describe('shortenStorageUnit', function () {
    let shortenStorageUnit;

    beforeEach(function () {
      shortenStorageUnit = this.NumberUtils.shortenStorageUnit;
    });

    afterEach(function () {
      shortenStorageUnit = null;
    });

    it('does not break if number is 0', function () {
      expect(shortenStorageUnit(0, 'MB')).toEqual('0 MB');
    });

    it('transforms numbers lower than 0.99 into smaller units', function () {
      expect(shortenStorageUnit(0.01, 'TB')).toEqual('10 GB');
      expect(shortenStorageUnit(0.0025, 'TB')).toEqual('2.5 GB');
      expect(shortenStorageUnit(0.615, 'TB')).toEqual('615 GB');
    });

    it('does not transform numbers greater than 0.99 and smaller than 1000', function () {
      expect(shortenStorageUnit(1.01, 'TB')).toEqual('1.01 TB');
      expect(shortenStorageUnit(999, 'GB')).toEqual('999 GB');
    });

    it('transforms numbers bigger than 999 into bigger units', function () {
      expect(shortenStorageUnit(1000, 'GB')).toEqual('1 TB');
      expect(shortenStorageUnit(25729, 'MB')).toEqual('25.73 GB');
    });
  });
});
