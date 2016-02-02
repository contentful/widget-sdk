'use strict';

describe('cfKnowledgeBase directive', function () {
  var el, scope, $location, analytics;

  function getLink() { return el.find('a').first(); }

  beforeEach(function () {
    module('contentful/test');
    $location = this.$inject('$location');
    analytics = this.$inject('analytics');
    analytics.knowledgeBase = sinon.stub();
    scope = this.$inject('$rootScope');
  });

  describe('points to knowledge base', function () {
    beforeEach(function () {
      sinon.stub($location, 'host', _.constant('app.test.com'));
      sinon.stub($location, 'protocol', _.constant('http'));
      el = this.$compile('<cf-knowledge-base target="entry" />');
      scope.$digest();
    });

    afterEach(function () {
      $location.host.restore();
      $location.protocol.restore();
    });

    it('has href', function () {
      var href = getLink().attr('href');
      var base = 'http://test.com/';
      expect(href.substring(0, base.length)).toBe(base);
      expect(getLink().attr('target')).toBe('_blank');
    });

    it('sends analytics event', function () {
      el.click();
      sinon.assert.calledWith(analytics.knowledgeBase, 'entry');
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
      var children = getLink().children();
      expect(children.length).toBe(1);
      expect(children[0].tagName).toBe('I');
    });

    it('has no text class', function () {
      var classNames = getLink().attr('class');
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
