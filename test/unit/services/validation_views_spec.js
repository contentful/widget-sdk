'use strict';

describe('predefined validation regexps', function () {

  beforeEach(function () {
    module('contentful/test');
    var views = this.$inject('validationViews');
    this.views = views.get('regexp');
  });

  describe('Date (EU) RegExp', function () {
    beforeEach(function () {
      this.regexp = _.find(this.views, {name: 'date-eu'}).pattern;
    });

    it('validates common separators', function () {
      expect('01-01-1900').toMatch(this.regexp);
      expect('01.01.1900').toMatch(this.regexp);
      expect('01-01/1900').toMatch(this.regexp);
      expect('01 01.1900').toMatch(this.regexp);
    });

    it('validates single digit days and months', function () {
      expect('1-01-1900').toMatch(this.regexp);
      expect('01.1.1900').toMatch(this.regexp);
    });

    it('validates double digit years', function () {
      expect('1-1-15').toMatch(this.regexp);
      expect('1-1-15').toMatch(this.regexp);
    });

    it('rejects too large values', function () {
      expect('32-1-15').not.toMatch(this.regexp);
      expect('100-1-15').not.toMatch(this.regexp);
      expect('1-13-15').not.toMatch(this.regexp);
      expect('1-123-15').not.toMatch(this.regexp);
    });

  });

});
