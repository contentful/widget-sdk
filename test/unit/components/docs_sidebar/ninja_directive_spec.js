'use strict';

import {times} from 'lodash';

describe('cfNinja Directive', function () {
  beforeEach(function () {
    module('contentful/test');
    this.$timeout = this.$inject('$timeout');
    this.$document = this.$inject('$document');
    this.TheStore = this.$inject('TheStore');
    this.TheStore.get = sinon.stub();
    this.TheStore.set = sinon.stub();

    const ninjaSelector = '[aria-label="Open docs sidebar"]';
    const modalSelector = '.docs-helper__modal';
    const bgSelector = '.docs-helper__bg';
    const nextSelector = '[aria-label="Next"]';
    const calloutSelector = '.docs-helper__callout';

    this.compileElement = function () {
      this.element = this.$compile('<cf-ninja />');
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

    this.hasText = function (text, isPresent = true) {
      const isFound = !!this.element.find(`:contains("${text}")`).length;
      expect(isFound).toBe(isPresent);
    };

    this.assertMinimizedWithCallout = function () {
      expect(this.element.find(ninjaSelector).length).toBe(1);
      expect(this.element.find(calloutSelector).length).toBe(1);
    };

    this.assertMinimized = function () {
      expect(this.element.find(ninjaSelector).length).toBe(1);
      expect(this.element.find(calloutSelector).length).toBe(0);
    };

    this.assertHidden = function () {
      expect(this.element.find(ninjaSelector).length).toBe(0);
    };

    this.assertExpanded = function () {
      expect(this.element.find(modalSelector).length).toBe(1);
    };

    this.assertShowNextPrompt = function (shouldShow = true) {
      const isFound = !!this.element.find(nextSelector).length;
      expect(isFound).toBe(shouldShow);
    };

    this.assertValuePersisted = function (key, value) {
      sinon.assert.calledWith(
        this.TheStore.set,
        'docsSidebar',
        sinon.match.has(key, value)
      );
    };
  });

  describe('Displays ninja state', function () {
    beforeEach(function () {
      this.compileElement();
    });

    it('displays ninja with callout', function () {
      this.assertMinimizedWithCallout();
    });

    it('closes on background click', function () {
      this.clickNinja();
      this.clickBg();
      this.assertMinimized();
    });

    it('can be expanded / minimized', function () {
      this.clickNinja();
      this.assertExpanded();
      this.keyDown(27);
      this.assertMinimized();
    });

    it('toggles with N', function () {
      this.clickNinja();
      this.keyDown(78);
      this.assertHidden();
      this.assertValuePersisted('isHidden', true);
      this.keyDown(78);
      this.assertValuePersisted('isHidden', false);
      this.assertExpanded();
    });
  });

  describe('Intro sequence', function () {
    beforeEach(function () {
      this.compileElement();
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

    it('displays intro sequence', function () {
      this.compileElement();
      this.clickNinja();
      this.hasText('Hello fellow Content-Ninja');
    });

    it('skips intro sequence if it has been seen', function () {
      this.TheStore.get.withArgs('docsSidebar').returns({introCompleted: true});
      this.compileElement();
      this.clickNinja();
      this.hasText('Hello fellow Content-Ninja', false);
    });

    it('marks intro as completed when all steps are seen', function () {
      this.compileElement();
      this.clickNinja();
      times(9, () => {
        this.keyDown(32);
      });
      this.clickBg();
      this.assertValuePersisted('introCompleted', true);
    });
  });

  xdescribe('State / navigation');


});
