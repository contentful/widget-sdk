import { toLocaleString, shorten, shortenStorageUnit } from './NumberUtils.es6';

describe('NumberUtils', () => {
  describe('toLocaleString', () => {
    it('localizes a number, transforming it into a string', () => {
      expect(toLocaleString(1000)).toEqual('1,000');
      expect(toLocaleString(1000000)).toEqual('1,000,000');
    });
  });

  describe('shorten', () => {
    it('does not change numbers lower than 1000', () => {
      expect(shorten(999)).toEqual(999);
    });

    it('shortens in thousands', () => {
      expect(shorten(1e3)).toEqual('1K');
      expect(shorten(1e4)).toEqual('10K');
      expect(shorten(1e5)).toEqual('100K');
    });

    it('shortens thousands with up to two decimal places', () => {
      expect(shorten(2550)).toEqual('2.55K');
      expect(shorten(25550)).toEqual('25.55K');
      expect(shorten(255550)).toEqual('255.55K');
    });

    it('shortens in millions', () => {
      expect(shorten(1e6)).toEqual('1M');
      expect(shorten(1e7)).toEqual('10M');
      expect(shorten(1e8)).toEqual('100M');
    });

    it('shortens millions with up to two decimal places', () => {
      expect(shorten(2550000)).toEqual('2.55M');
      expect(shorten(25550000)).toEqual('25.55M');
      expect(shorten(255550000)).toEqual('255.55M');
    });

    it('removes unnecessary decimal places', () => {
      expect(shorten(2500)).toEqual('2.5K');
      expect(shorten(2500000)).toEqual('2.5M');
    });
  });

  describe('shortenStorageUnit', () => {
    it('supports 0 as a number', () => {
      expect(shortenStorageUnit(0, 'MB')).toEqual('0 B');
    });

    it('transforms numbers lower than 0.99 into smaller units', () => {
      expect(shortenStorageUnit(0.01, 'PB')).toEqual('10 TB');
      expect(shortenStorageUnit(0.0025, 'TB')).toEqual('2.5 GB');
      expect(shortenStorageUnit(0.615, 'TB')).toEqual('615 GB');
    });

    it('does not transform numbers greater than 0.99 and smaller than 1000', () => {
      expect(shortenStorageUnit(1.01, 'TB')).toEqual('1.01 TB');
      expect(shortenStorageUnit(999, 'GB')).toEqual('999 GB');
    });

    it('transforms numbers bigger than 999 into bigger units', () => {
      expect(shortenStorageUnit(1000, 'B')).toEqual('1 KB');
      expect(shortenStorageUnit(25729, 'MB')).toEqual('25.73 GB');
    });

    it('does not transform if there no bigger unit', () => {
      expect(shortenStorageUnit(10000, 'PB')).toEqual('10000 PB');
    });

    it('does not transform if there is no smaller unit', () => {
      expect(shortenStorageUnit(0.01, 'B')).toEqual('0.01 B');
    });
  });
});
