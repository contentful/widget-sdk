'use strict';

describe('Link organizer', () => {
  var LinkOrganizer;

  beforeEach(function () {
    module('contentful/test');
    LinkOrganizer = this.$inject('LinkOrganizer');
  });

  describe('Inline link finder', () => {
    it('Finds all inline links in text', () => {
      var subject = 'test [link](http://url.com) test [link2](http://url2.com) test [link3](http://url.com)';
      var found = LinkOrganizer.findInline(subject);
      expect(found.length).toBe(3);
      expect(found[0].match).toBe('[link](http://url.com)');
      expect(found[0].text).toBe('link');
      expect(found[0].href).toBe('http://url.com');
      expect(found[0].title).toBe('');
    });

    it('Finds and standardizes title', () => {
      var subject = 'test [x](http://url.com   "title!") [y](http://xyz.com title 2   )';
      var found = LinkOrganizer.findInline(subject);
      expect(found.length).toBe(2);
      expect(found[0].title).toBe('title!');
      expect(found[1].title).toBe('title 2');
    });
  });

  describe('Reference finder', () => {
    it('Finds all references in text', () => {
      var subject = 'test [x][1] test [y][2] [with space separator] [3]';
      var found = LinkOrganizer.findRefs(subject);
      expect(found.length).toBe(3);
      expect(found[0].match).toBe('[x][1]');
      expect(found[2].match).toBe('[with space separator] [3]');
      expect(found[1].text).toBe('y');
      expect(found[1].id).toBe('2');
    });
  });

  describe('Label finder', () => {
    var subject = [
      '[1]:  http://test.com',
      '[2]: http://url.com',
      '[string]: http://url.com',
      '[4]: http://test.com  "Hello world"'
    ].join('\n');

    it('Finds all labels', () => {
      var found = LinkOrganizer.findLabels(subject);
      expect(found.length).toBe(4);
      expect(found[0].id).toBe('1');
      expect(found[2].id).toBe('string');
      expect(found[0].href).toBe('http://test.com');
      expect(found[3].href).toBe('http://test.com');
      expect(found[1].title).toBe('');
      expect(found[3].title).toBe('Hello world');
    });

    it('Finds max label id', () => {
      expect(LinkOrganizer.findMaxLabelId(subject)).toBe(4);
    });
  });
});
