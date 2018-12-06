import _ from 'lodash';
import sinon from 'sinon';
import { createIsolatedSystem } from 'test/helpers/system-js';

describe('ReferenceEditor', () => {
  beforeEach(function*() {
    const system = createIsolatedSystem();

    this.analytics = {
      track: sinon.stub()
    };

    this.TheLocaleStore = {
      getActiveLocales: sinon.stub()
    };

    system.set('TheLocaleStore', { default: this.TheLocaleStore });
    system.set('analytics/Analytics.es6', this.analytics);

    const referenceEditorEvents = yield system.import('analytics/events/ReferenceEditor.es6');

    this.referenceEditorEvents = referenceEditorEvents;

    this.TheLocaleStore.getActiveLocales.returns([{}]);
  });

  describe('onEntryCreate', () => {
    it('tracks entry create', function() {
      const contentType = getMockContentType();

      this.referenceEditorEvents.onEntryCreate({
        contentType,
        isInlineEditingFeatureFlagEnabled: false
      });

      sinon.assert.calledWith(this.analytics.track, 'reference_editor:create_entry', {
        fields_count: 2,
        locales_count: 1,
        localized_fields_count: 1,
        widgets_count: 2,
        is_inline_editing_feature_flag_enabled: false,
        is_inline_editing_enabled_for_field: false,
        version: 2
      });
    });
  });

  describe('onEntryEdit', () => {
    it('tracks entry edit', function() {
      const contentType = getMockContentType();

      this.referenceEditorEvents.onEntryEdit({ contentType });

      sinon.assert.calledWith(this.analytics.track, 'reference_editor:edit_entry', {
        fields_count: 2,
        locales_count: 1,
        localized_fields_count: 1,
        is_inline_editing_feature_flag_enabled: false,
        widgets_count: 2,
        version: 2
      });
    });
  });

  describe('onToggleInlineEditor', () => {
    it('tracks inline editor toggle ', function() {
      const contentType = getMockContentType();

      this.referenceEditorEvents.onToggleInlineEditor({
        contentType,
        toggleState: false,
        selector: 'FIELD_ID.LOCALE'
      });

      sinon.assert.calledWith(this.analytics.track, 'reference_editor:toggle_inline_editor', {
        fields_count: 2,
        locales_count: 1,
        localized_fields_count: 1,
        widgets_count: 2,
        toggle_state: false,
        selector: 'FIELD_ID.LOCALE',
        version: 4
      });
    });

    it('tracks inline editor toggle without content type', function() {
      const contentType = null;

      this.referenceEditorEvents.onToggleInlineEditor({
        contentType,
        toggleState: true,
        selector: 'FIELD_ID.LOCALE'
      });

      sinon.assert.calledWith(this.analytics.track, 'reference_editor:toggle_inline_editor', {
        fields_count: 0,
        locales_count: 1,
        localized_fields_count: 0,
        widgets_count: 0,
        toggle_state: true,
        selector: 'FIELD_ID.LOCALE',
        version: 4
      });
    });
  });
});

function getMockContentType() {
  return {
    data: {
      fields: [
        {
          id: 'field-1'
        },
        {
          id: 'field-2',
          localized: true
        }
      ]
    }
  };
}
