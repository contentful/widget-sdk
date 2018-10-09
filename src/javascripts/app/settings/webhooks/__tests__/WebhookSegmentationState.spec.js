import {
  createMap,
  changeAction,
  isActionChecked,
  transformMapToTopics,
  transformTopicsToMap
} from '../WebhookSegmentationState.es6';

describe('WebhookSegmentationState', () => {
  describe('translating topics to selection', () => {
    it('selects specific topics', () => {
      const transformed = transformTopicsToMap(['Entry.autosave', 'Entry.delete']);

      expect(isActionChecked(transformed, 'Entry', 'autosave')).toBe(true);
      expect(isActionChecked(transformed, 'Entry', 'delete')).toBe(true);
    });

    it('selects entity type wildcards', () => {
      const transformed = transformTopicsToMap(['ContentType.*']);
      expect(isActionChecked(transformed, 'ContentType', '*')).toBe(true);
    });

    it('selects action wildcards', () => {
      const transformed = transformTopicsToMap(['*.save']);
      expect(isActionChecked(transformed, '*', 'save')).toBe(true);
    });
  });

  describe('translating selection to topics', () => {
    it('translates specific topics', () => {
      const map = changeAction(createMap(false), 'Entry', 'save', true);
      expect(transformMapToTopics(map)).toEqual(['Entry.save']);
    });

    it('translates entity type wildcards, removes redundant topics', () => {
      const map = changeAction(createMap(false), 'Entry', '*', true);
      expect(transformMapToTopics(map)).toEqual(['Entry.*']);
    });

    it('translates action wildcards, removes redundant topics', () => {
      const map = changeAction(createMap(false), '*', 'save', true);
      expect(transformMapToTopics(map)).toEqual(['*.save']);
    });

    it('utilizes all types of translation creating minimal set of topics', () => {
      let map = changeAction(createMap(false), 'Entry', 'save', true);
      map = changeAction(map, 'Asset', 'save', true);
      map = changeAction(map, 'ContentType', 'save', true);
      expect(transformMapToTopics(map)).toEqual(['*.save']);
    });
  });
});
