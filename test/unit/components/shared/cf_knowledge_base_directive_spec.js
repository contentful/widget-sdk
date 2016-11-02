'use strict';

describe('cfKnowledgeBase directive', function () {
  let el, scope;

  function getLink () { return el.find('a').first(); }

  beforeEach(function () {
    module('contentful/test', function (environment) {
      environment.settings.marketing_url = 'http://test.com';
    });
    scope = this.$inject('$rootScope');
  });

  afterEach(function () {
    el = scope = null;
  });

  describe('points to knowledge base', function () {
    beforeEach(function () {
      el = this.$compile('<cf-knowledge-base target="entry" />');
      scope.$digest();
    });

    it('has href', function () {
      const href = getLink().attr('href');
      expect(href).toBe('http://test.com/developers/docs/concepts/data-model/');
      expect(getLink().attr('target')).toBe('_blank');
    });
  });

  describe('icon only', function () {
    beforeEach(function () {
      el = this.$compile('<cf-knowledge-base target="entry" />');
      scope.$digest();
    });

    it('has no tooltip text', function () {
      expect(getLink().attr('tooltip')).toBe('');
    });

    it('has no link text', function () {
      const children = getLink().children();
      expect(children.length).toBe(1);
      expect(children[0].tagName).toBe('I');
    });

    it('has no text class', function () {
      const classNames = getLink().attr('class');
      expect(classNames.indexOf('--no-text') > -1).toBe(true);
    });
  });

  describe('link/tooltip text', function () {
    beforeEach(function () {
      el = this.$compile('<cf-knowledge-base target="entry" text="testtext" tooltip-text="tooltiptesttext" />');
      scope.$digest();
    });

    it('has link text and icon', function () {
      expect(getLink().text()).toBe('testtext');
    });

    it('has tooltip text', function () {
      expect(getLink().attr('tooltip')).toBe('tooltiptesttext');
    });
  });
});
