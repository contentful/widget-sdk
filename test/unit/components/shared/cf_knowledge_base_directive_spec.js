'use strict';

describe('cfKnowledgeBase directive', () => {
  let el, scope;

  function getLink() {
    return el.find('a').first();
  }

  beforeEach(function() {
    module('contentful/test');
    scope = this.$inject('$rootScope');
  });

  afterEach(() => {
    el = scope = null;
  });

  describe('points to knowledge base', () => {
    beforeEach(function() {
      el = this.$compile('<cf-knowledge-base target="entry" />');
      scope.$digest();
    });

    it('has href', () => {
      const href = getLink().attr('href');
      expect(href).toBe('//www.test.com/developers/docs/concepts/data-model/');
      expect(getLink().attr('target')).toBe('_blank');
    });
  });

  describe('icon only', () => {
    beforeEach(function() {
      el = this.$compile('<cf-knowledge-base target="entry" />');
      scope.$digest();
    });

    it('has no link text', () => {
      const children = getLink().children();
      expect(children.length).toBe(1);
      expect(children[0].tagName).toBe('I');
    });

    it('has no text class', () => {
      const classNames = getLink().attr('class');
      expect(classNames.indexOf('--no-text') > -1).toBe(true);
    });
  });

  describe('link text', () => {
    beforeEach(function() {
      el = this.$compile('<cf-knowledge-base target="entry" text="testtext" />');
      scope.$digest();
    });

    it('has link text and icon', () => {
      expect(getLink().text()).toBe('testtext');
    });
  });
});
