'use strict';

describe('context menu', function () {
  beforeEach(module('cf.ui'));
  beforeEach(function () {
    this.detach = this.$inject('contextMenu').init();
    var $document = this.$inject('$document');
    this.$body = $document.find('body');
  });

  afterEach(function () {
    this.$body.empty();
    this.detach();
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

  describe('two context menus', function () {

    var selectA = '[cf-context-menu]:contains(A)';
    var selectB = '[cf-context-menu]:contains(B)';

    beforeEach(function () {
      this.$body.append(this.$compile(
        '<button cf-context-menu-trigger>OpenA</button>' +
        '<div cf-context-menu>A</div>' +
        '<button cf-context-menu-trigger>OpenB</button>' +
        '<div cf-context-menu>B</div>'
      ));
    });

    it('it opens the first', function () {
      expect(this.$body.find(selectA).is(':visible')).toBe(false);
      this.$body.find('button[cf-context-menu-trigger]:contains(OpenA)').click();
      expect(this.$body.find(selectA).is(':visible')).toBe(true);
    });

    it('it opens the second', function () {
      expect(this.$body.find(selectB).is(':visible')).toBe(false);
      this.$body.find('button[cf-context-menu-trigger]:contains(OpenB)').click();
      expect(this.$body.find(selectB).is(':visible')).toBe(true);
    });

    it('it closes the first when opening the second', function () {
      this.$body.find('button[cf-context-menu-trigger]:contains(OpenA)').click();
      expect(this.$body.find(selectA).is(':visible')).toBe(true);
      this.$body.find('button[cf-context-menu-trigger]:contains(OpenB)').click();
      expect(this.$body.find(selectA).is(':visible')).toBe(false);
    });

  });


});
