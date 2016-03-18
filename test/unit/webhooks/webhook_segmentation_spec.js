'use strict';

describe('Webhook Segmentation directive', function () {

  beforeEach(function () {
    module('contentful/test');

    this.compile = function (topics) {
      var data = {topics: topics || []};
      this.element = this.$compile('<cf-webhook-segmentation topics="topics" />', data);
      this.scope = this.element.isolateScope();
    }.bind(this);
  });

  describe('selection mode', function () {
    beforeEach(function () {
      this.radio = function (i) { return this.element.find('input[type="radio"]').get(i); };
      this.hasTable = function () { return this.element.find('table').length > 0; };
    });

    it('uses "all" mode if topic list contain double wildcard *.*', function () {
      this.compile(['*.*']);
      expect(this.radio(0).checked).toBe(true);
      expect(this.hasTable()).toBe(false);
    });

    it('shows table if topic list is empty', function () {
      this.compile();
      expect(this.radio(1).checked).toBe(true);
      expect(this.hasTable()).toBe(true);
    });

    it('shows table if topic list contains specific topics', function () {
      this.compile(['ContentType.*', 'Entry.delete']);
      expect(this.radio(1).checked).toBe(true);
      expect(this.hasTable()).toBe(true);
    });

    it('switching from specific to "all" hides table and uses *.*, but stores selection', function () {
      this.compile(['ContentType.delete']);
      $(this.radio(0)).prop('checked', true).click();
      this.$apply();

      expect(this.hasTable()).toBe(false);
      expect(this.scope.topics).toEqual(['*.*']);
      expect(this.scope.selection['ContentType.delete']).toBe(true);
    });

    it('switching from "all" mode to specific events shows table and restores selection', function () {
      this.compile(['*.*', 'Entry.autosave']);
      $(this.radio(1)).prop('checked', true).click();
      this.$apply();

      expect(this.hasTable()).toBe(true);
      expect(this.scope.topics).toEqual(['Entry.autosave']);
      expect(this.scope.selection['*.*']).toBeUndefined();
    });
  });

  describe('translating topics to selection', function () {
    it('selects specific topics', function () {
      this.compile(['Entry.autosave', 'Entry.delete']);
      expect(this.scope.selection['Entry.autosave']).toBe(true);
      expect(this.scope.selection['Entry.delete']).toBe(true);
    });

    it('selects entity type wildcards', function () {
      this.compile(['ContentType.*']);
      expect(this.scope.selection['ContentType.*']).toBe(true);
    });

    it('selects action wildcards', function () {
      this.compile(['*.save']);
      expect(this.scope.selection['*.save']).toBe(true);
    });
  });

  describe('translating selection to topics', function () {
    beforeEach(function () {
      this.init = function (selection) {
        this.compile();
        _.extend(this.scope.selection, selection);
        this.$apply();
      };
    });

    it('translates specific topics', function () {
      this.init({'Entry.save': true});
      expect(this.scope.topics).toEqual(['Entry.save']);
    });

    it('translates entity type wildcards, removes redundant topics', function () {
      this.init({'Entry.save': true, 'Entry.*': true});
      expect(this.scope.topics).toEqual(['Entry.*']);
    });

    it('translates action wildcards, removes redundant topics', function () {
      this.init({'Entry.save': true, '*.save': true});
      expect(this.scope.topics).toEqual(['*.save']);
    });

    it('utilizes all types of translation creating minimal set of topics', function () {
      this.init({'Entry.*': true, 'Entry.save': true, '*.save': true, 'Asset.delete': true, 'Asset.save': true});
      expect(this.scope.topics).toEqual(['*.save', 'Asset.delete', 'Entry.*']);
    });
  });

  describe('wildcard selections', function () {
    it('selects all horizontal checkboxes for entity wildcard, stores selection', function () {
      var inputs = function () {
        return this.element.find('tbody tr:first-child input');
      }.bind(this);

      this.compile(['ContentType.save']);
      inputs().first().prop('checked', true).click();
      this.$apply();

      inputs().each(function () { expect(this.checked).toBe(true); });
      expect(this.scope.selection['ContentType.*']).toBe(true);
      expect(this.scope.selection['ContentType.save']).toBe(true);
    });

    it('selects all vertical checkboxes for action wildcard, stores selection', function () {
      var inputs = function () {
        return this.element.find('tbody tr td:nth-child(2) input');
      }.bind(this);

      this.compile(['Asset.create']);
      inputs().last().prop('checked', true).click();
      this.$apply();

      inputs().each(function () { expect(this.checked).toBe(true); });
      expect(this.scope.selection['*.create']).toBe(true);
      expect(this.scope.selection['Asset.create']).toBe(true);
    });
  });
});
