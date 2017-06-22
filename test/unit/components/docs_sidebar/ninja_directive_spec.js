'use strict';

import {times} from 'lodash';

describe('cfNinja Directive', function () {
  beforeEach(function () {
    module('contentful/test');
    this.element = this.$compile('<cf-ninja />');
    this.$timeout = this.$inject('$timeout');
    this.$document = this.$inject('$document');

    const ninjaSelector = '[aria-label="Open docs sidebar"]';
    const modalSelector = '.docs-helper__modal';
    const bgSelector = '.docs-helper__bg';
    const nextSelector = '[aria-label="Next"]';

    this.assertMinimized = function () {
      expect(this.element.find(ninjaSelector).length).toBe(1);
    };

    this.assertHidden = function () {
      expect(this.element.find(ninjaSelector).length).toBe(0);
    };

    this.assertExpanded = function () {
      expect(this.element.find(modalSelector).length).toBe(1);
    };

    this.keyDown = function (code) {
      const body = $(this.$document).find('body');
      body.trigger($.Event('keydown', {keyCode: code}));
      this.$timeout.flush();
    };

    this.clickBg = function () {
      this.element.find(bgSelector).trigger('click');
      this.$timeout.flush();
    };

    this.clickNinja = function () {
      this.element.find(ninjaSelector).trigger('click');
      this.$timeout.flush();
    };

    this.hasText = function (text) {
      const el = this.element.find(`:contains("${text}")`);
      expect(el.length).toBeGreaterThan(0);
    };

    this.assertShowNextPrompt = function (shouldShow = true) {
      const isFound = !!this.element.find(nextSelector).length;
      expect(isFound).toBe(shouldShow);
    };
  });

  describe('Show/hide ninja', function () {
    it('displays collapsed ninja', function () {
      this.assertMinimized();
    });

    it('toggles with N', function () {
      this.keyDown(78);
      this.assertHidden();
      this.keyDown(78);
      this.assertMinimized();
    });

    it('closes on background click', function () {
      this.clickBg();
      this.assertMinimized();
    });

    it('can be expanded / minimized', function () {
      this.clickNinja();
      this.assertExpanded();
      this.keyDown(27);
      this.assertMinimized();
    });
  });


  describe('Intro sequence', function () {
    beforeEach(function () {
      this.clickNinja();
    });

    it('is displayed if not seen yet', function () {
      this.hasText('Hello fellow Content-Ninja');
    });

    it('displays next prompt until all messages are seen', function () {
      times(8, () => {
        this.keyDown(32);
        this.assertShowNextPrompt();
      });
      this.keyDown(32);
      this.assertShowNextPrompt(false);

    });


    xit('is not displayed if it has been seen already');

  });

  xdescribe('State / navigation');

  xdescribe('Progress is stored');

});
