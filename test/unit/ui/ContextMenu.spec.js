import setupContextMenuHandler from 'ui/ContextMenuHandler.es6';
import { h } from 'utils/legacy-html-hyperscript';
import $ from 'jquery';

describe('context menu', () => {
  beforeEach(function() {
    module('contentful/test');
    const $document = this.$inject('$document');
    this.detach = setupContextMenuHandler($document);
    this.$body = $document.find('body');
    this.$body.append(h('style', ['[cf-context-menu] { display: none }']));
  });

  afterEach(function() {
    this.$body.empty();
    this.detach();
  });

  describe('one context menu', () => {
    beforeEach(function() {
      this.$body.append(
        this.$compile(
          [
            h(
              'button',
              {
                cfContextMenuTrigger: true
              },
              ['Open']
            ),
            h(
              'div',
              {
                cfContextMenu: true
              },
              [h('button', ['Action'])]
            ),
            h('div#outside')
          ].join('')
        )
      );
    });

    it('is opened by trigger', function() {
      expect(this.$body.find('[cf-context-menu]').is(':visible')).toBe(false);
      this.$body.find('button[cf-context-menu-trigger]').click();
      expect(this.$body.find('[cf-context-menu]').is(':visible')).toBe(true);
    });

    it('is not opened by aria-disabled trigger', function() {
      this.$body.find('[cf-context-menu-trigger]').attr('aria-disabled', 'true');
      expect(this.$body.find('[cf-context-menu]').is(':visible')).toBe(false);
      this.$body.find('button[cf-context-menu-trigger]').click();
      expect(this.$body.find('[cf-context-menu]').is(':visible')).toBe(false);
    });

    it('is not opened by button disabled trigger', function() {
      const trigger = this.$body.find('button[cf-context-menu-trigger]');
      trigger.prop('disabled', true);
      expect(this.$body.find('[cf-context-menu]').is(':visible')).toBe(false);

      const inner = $('<div>inner not disabled</div>');
      trigger.append(inner);
      inner.click();
      expect(this.$body.find('[cf-context-menu]').is(':visible')).toBe(false);
    });

    it('is closed by outside click', function() {
      this.$body.find('button[cf-context-menu-trigger]').click();
      expect(this.$body.find('[cf-context-menu]').is(':visible')).toBe(true);
      this.$body.find('#outside').click();
      expect(this.$body.find('[cf-context-menu]').is(':visible')).toBe(false);
    });

    it('is closed by menu item click', function() {
      this.$body.find('button[cf-context-menu-trigger]').click();
      expect(this.$body.find('[cf-context-menu]').is(':visible')).toBe(true);
      this.$body.find('[cf-context-menu] > button').click();
      expect(this.$body.find('[cf-context-menu]').is(':visible')).toBe(false);
    });

    it('is closed by clicking trigger again', function() {
      this.$body.find('button[cf-context-menu-trigger]').click();
      expect(this.$body.find('[cf-context-menu]').is(':visible')).toBe(true);
      this.$body.find('button[cf-context-menu-trigger]').click();
      expect(this.$body.find('[cf-context-menu]').is(':visible')).toBe(false);
    });
  });

  describe('nested context menu', () => {
    beforeEach(function() {
      this.$body.append(
        this.$compile(
          '<button id="trigger-outer" cf-context-menu-trigger>Open</button>' +
            '<div id="outer-menu" cf-context-menu>' +
            '<button id="trigger-inner" cf-context-menu-trigger>Action</button>' +
            '<div id="inner-menu" cf-context-menu>' +
            '<button></button>' +
            '</div>' +
            '</div>'
        )
      );
    });

    it('is opened by trigger', function() {
      expect(this.$body.find('#inner-menu').is(':visible')).toBe(false);
      this.$body.find('#trigger-outer').click();
      this.$body.find('#trigger-inner').click();
      expect(this.$body.find('#inner-menu').is(':visible')).toBe(true);
    });

    it('trigger keeps outer menu opend', function() {
      expect(this.$body.find('#outer-menu').is(':visible')).toBe(false);

      this.$body.find('#trigger-outer').click();
      expect(this.$body.find('#outer-menu').is(':visible')).toBe(true);

      this.$body.find('#trigger-inner').click();
      expect(this.$body.find('#outer-menu').is(':visible')).toBe(true);
    });

    it('is closed by menu item click', function() {
      this.$body.find('#trigger-outer').click();
      this.$body.find('#trigger-inner').click();
      expect(this.$body.find('#inner-menu').is(':visible')).toBe(true);
      this.$body.find('#inner-menu > button').click();
      expect(this.$body.find('#inner-menu').is(':visible')).toBe(false);
    });

    it('closes outer menu by item click', function() {
      this.$body.find('#trigger-outer').click();
      this.$body.find('#trigger-inner').click();
      expect(this.$body.find('#outer-menu').is(':visible')).toBe(true);
      this.$body.find('#inner-menu > button').click();
      expect(this.$body.find('#outer-menu').is(':visible')).toBe(false);
    });
  });

  describe('two context menus', () => {
    const selectA = '[cf-context-menu]:contains(A)';
    const selectB = '[cf-context-menu]:contains(B)';

    beforeEach(function() {
      this.$body.append(
        this.$compile(
          '<button cf-context-menu-trigger>OpenA</button>' +
            '<div cf-context-menu>A</div>' +
            '<button cf-context-menu-trigger>OpenB</button>' +
            '<div cf-context-menu>B</div>'
        )
      );
    });

    it('it opens the first', function() {
      expect(this.$body.find(selectA).is(':visible')).toBe(false);
      this.$body.find('button[cf-context-menu-trigger]:contains(OpenA)').click();
      expect(this.$body.find(selectA).is(':visible')).toBe(true);
    });

    it('it opens the second', function() {
      expect(this.$body.find(selectB).is(':visible')).toBe(false);
      this.$body.find('button[cf-context-menu-trigger]:contains(OpenB)').click();
      expect(this.$body.find(selectB).is(':visible')).toBe(true);
    });

    it('it closes the first when opening the second', function() {
      this.$body.find('button[cf-context-menu-trigger]:contains(OpenA)').click();
      expect(this.$body.find(selectA).is(':visible')).toBe(true);
      this.$body.find('button[cf-context-menu-trigger]:contains(OpenB)').click();
      expect(this.$body.find(selectA).is(':visible')).toBe(false);
    });
  });
});
