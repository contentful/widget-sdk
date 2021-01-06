import _ from 'lodash';
import validationViews from 'services/validationViews';

describe('predefined validation regexps', () => {
  let views;
  beforeEach(function () {
    views = validationViews.get('regexp');
  });

  describe('Date (EU) RegExp', () => {
    let regexp;
    beforeEach(function () {
      regexp = new RegExp(_.find(views, { name: 'date-eu' }).pattern);
    });

    it('validates common separators', function () {
      expect('01-01-1900').toMatch(regexp);
      expect('01.01.1900').toMatch(regexp);
      expect('01-01/1900').toMatch(regexp);
      expect('01 01.1900').toMatch(regexp);
    });

    it('validates single digit days and months', function () {
      expect('1-01-1900').toMatch(regexp);
      expect('01.1.1900').toMatch(regexp);
    });

    it('validates double digit years', function () {
      expect('1-1-15').toMatch(regexp);
      expect('1-1-15').toMatch(regexp);
    });

    it('rejects too large values', function () {
      expect('32-1-15').not.toMatch(regexp);
      expect('100-1-15').not.toMatch(regexp);
      expect('1-13-15').not.toMatch(regexp);
      expect('1-123-15').not.toMatch(regexp);
    });
  });

  describe('time', () => {
    it('validates 12h time', function () {
      const regexp = new RegExp(_.find(views, { name: '12h-time' }).pattern);
      expectRegexpMatch(regexp, [
        '01:00 pm',
        '01:00 pM',
        '01:00 Am',
        '01:00AM',
        '1:00 am',
        '12:00 am',
        '12:59 pm',
        '1:00:00 am',
      ]);
    });

    it('rejects 12h time', function () {
      const regexp = new RegExp(_.find(views, { name: '12h-time' }).pattern);
      expectRegexpFail(regexp, ['00:59 am', '01:0 am', '01:00:60 am']);
    });

    it('validates 24h time', function () {
      const regexp = new RegExp(_.find(views, { name: '24h-time' }).pattern);
      expectRegexpMatch(regexp, ['00:00', '01:00', '13:00', '23:59', '1:00', '1:00:00']);
    });

    it('rejects 24h time', function () {
      const regexp = new RegExp(_.find(views, { name: '24h-time' }).pattern);
      expectRegexpFail(regexp, ['24:00', '00:60', '01:00:60', '01:0', '10:00 am']);
    });

    function expectRegexpMatch(re, values) {
      _.forEach(values, (value) => {
        expect(value).toMatch(re);
      });
    }

    function expectRegexpFail(re, values) {
      _.forEach(values, (value) => {
        expect(value).not.toMatch(re);
      });
    }
  });
});
