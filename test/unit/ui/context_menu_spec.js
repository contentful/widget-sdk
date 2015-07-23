'use strict';

describe('context menu', function () {
  beforeEach(module('cf.ui'));
  beforeEach(function () {
    var $document = this.$inject('$document');
    this.$body = $document.find('body');
  });

  afterEach(function () {
    this.$body.empty();
  });

  describe('one context menu', function () {

    beforeEach(function () {
      this.$body.append(this.$compile(
        '<button cf-context-menu-trigger>Open</button>' +
        '<div cf-context-menu>' +
          '<button>Action</button>' +
        '</div>' +
        '<div id="outside"></div>'
      ));
    });

    it('is opened by trigger', function () {
      expect(this.$body.find('[cf-context-menu]').is(':visible')).toBe(false);
      this.$body.find('button[cf-context-menu-trigger]').click();
      expect(this.$body.find('[cf-context-menu]').is(':visible')).toBe(true);
    });

    it('is closed by outside click', function () {
      this.$body.find('button[cf-context-menu-trigger]').click();
      expect(this.$body.find('[cf-context-menu]').is(':visible')).toBe(true);
      this.$body.find('#outside').click();
      expect(this.$body.find('[cf-context-menu]').is(':visible')).toBe(false);
    });

    it('is closed by menu item click', function () {
      this.$body.find('button[cf-context-menu-trigger]').click();
      expect(this.$body.find('[cf-context-menu]').is(':visible')).toBe(true);
      this.$body.find('[cf-context-menu] > button').click();
      expect(this.$body.find('[cf-context-menu]').is(':visible')).toBe(false);
    });

    it('is closed by clicking trigger again', function () {
      this.$body.find('button[cf-context-menu-trigger]').click();
      expect(this.$body.find('[cf-context-menu]').is(':visible')).toBe(true);
      this.$body.find('button[cf-context-menu-trigger]').click();
      expect(this.$body.find('[cf-context-menu]').is(':visible')).toBe(false);
    });

  });

  describe('nested context menu', function () {
    beforeEach(function () {
      this.$body.append(this.$compile(
        '<button id="trigger-outer" cf-context-menu-trigger>Open</button>' +
        '<div id="outer-menu" cf-context-menu>' +
          '<button id="trigger-inner" cf-context-menu-trigger>Action</button>' +
          '<div id="inner-menu" cf-context-menu>' +
            '<button></button>' +
          '</div>' +
        '</div>'
      ));
    });

    it('is opened by trigger', function () {
      expect(this.$body.find('#inner-menu').is(':visible')).toBe(false);
      this.$body.find('#trigger-outer').click();
      this.$body.find('#trigger-inner').click();
      expect(this.$body.find('#inner-menu').is(':visible')).toBe(true);
    });

    it('trigger keeps outer menu opend', function () {
      expect(this.$body.find('#outer-menu').is(':visible')).toBe(false);

      this.$body.find('#trigger-outer').click();
      expect(this.$body.find('#outer-menu').is(':visible')).toBe(true);

      this.$body.find('#trigger-inner').click();
      expect(this.$body.find('#outer-menu').is(':visible')).toBe(true);
    });

    it('is closed by menu item click', function () {
      this.$body.find('#trigger-outer').click();
      this.$body.find('#trigger-inner').click();
      expect(this.$body.find('#inner-menu').is(':visible')).toBe(true);
      this.$body.find('#inner-menu > button').click();
      expect(this.$body.find('#inner-menu').is(':visible')).toBe(false);
    });

    it('closes outer menu by item click', function () {
      this.$body.find('#trigger-outer').click();
      this.$body.find('#trigger-inner').click();
      expect(this.$body.find('#outer-menu').is(':visible')).toBe(true);
      this.$body.find('#inner-menu > button').click();
      expect(this.$body.find('#outer-menu').is(':visible')).toBe(false);
    });

  });

});
