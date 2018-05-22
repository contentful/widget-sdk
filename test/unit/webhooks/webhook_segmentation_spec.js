import {setCheckbox} from 'helpers/DOM';
import {
  createMap as createInternalState,
  changeAction,
  isActionChecked,
  transformMapToTopics,
  transformTopicsToMap
} from 'app/Webhooks/WebhookSegmentationState'

describe('Webhook Segmentation directive', function () {
  beforeEach(function () {
    module('contentful/test');

    this.compile = function (topics) {
      const data = { webhook: { topics: topics || [] } };
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

  });

  describe('translating topics to selection', function () {
    it('selects specific topics', function () {
      const transformed = transformTopicsToMap(['Entry.autosave', 'Entry.delete'])

      expect(isActionChecked(transformed, 'Entry', 'autosave')).toBe(true);
      expect(isActionChecked(transformed, 'Entry', 'delete')).toBe(true);
    });

    it('selects entity type wildcards', function () {
      const transformed = transformTopicsToMap(['ContentType.*'])
      expect(isActionChecked(transformed, 'ContentType', '*')).toBe(true);
    });

    it('selects action wildcards', function () {
      const transformed = transformTopicsToMap(['*.save'])
      expect(isActionChecked(transformed, '*', 'save')).toBe(true);
    });
  });

  describe('translating selection to topics', function () {
    it('translates specific topics', function () {
      const map = changeAction(createInternalState(false), 'Entry', 'save', true)
      expect(transformMapToTopics(map)).toEqual(['Entry.save']);
    });

    it('translates entity type wildcards, removes redundant topics', function () {
      const map = changeAction(createInternalState(false), 'Entry', '*', true)
      expect(transformMapToTopics(map)).toEqual(['Entry.*']);
    });

    it('translates action wildcards, removes redundant topics', function () {
      const map = changeAction(createInternalState(false), '*', 'save', true)
      expect(transformMapToTopics(map)).toEqual(['*.save']);
    });

    it('utilizes all types of translation creating minimal set of topics', function () {
      let map = changeAction(createInternalState(false), 'Entry', 'save', true)
      map = changeAction(map, 'Asset', 'save', true)
      map = changeAction(map, 'ContentType', 'save', true)
      expect(transformMapToTopics(map)).toEqual(['*.save']);
    });
  });

  describe('wildcard selections', function () {
    it('selects all horizontal checkboxes for entity wildcard, stores selection', function () {
      const inputs = function () {
        return this.element.find('tbody tr:nth-child(2) input');
      }.bind(this);

      this.compile(['Entry.save']);
      inputs().first()[0].click()
      this.$apply();

      inputs().each(function () { expect(this.checked).toBe(true); });
      expect(isActionChecked(this.scope.webhook.selection, 'Entry', '*')).toBe(true);
      expect(isActionChecked(this.scope.webhook.selection, 'Entry', 'save')).toBe(true);
    });

    it('selects all vertical checkboxes for action wildcard, stores selection', function () {
      const inputs = function () {
        return this.element.find('tbody tr td:nth-child(2) input');
      }.bind(this);

      this.compile(['Asset.create']);
      inputs().last()[0].click()
      this.$apply();

      debugger;
      inputs().each(function () { expect(this.checked).toBe(true); });
      expect(isActionChecked(this.scope.webhook.selection, '*', 'create')).toBe(true);
      expect(isActionChecked(this.scope.webhook.selection, 'Asset', 'create')).toBe(true);
    });
  });
});
