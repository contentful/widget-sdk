import _ from 'lodash';
import sinon from 'npm:sinon';
import { createIsolatedSystem } from 'test/helpers/system-js';

describe('ReferenceEditor', function () {
  beforeEach(function* () {
    const system = createIsolatedSystem();

    this.analytics = {
      track: sinon.stub()
    };

    this.TheLocaleStore = {
      getActiveLocales: sinon.stub()
    };

    system.set('TheLocaleStore', { default: this.TheLocaleStore });
    system.set('analytics/Analytics', this.analytics);

    const referenceEditorEvents = yield system.import(
      'analytics/events/ReferenceEditor'
    );

    this.referenceEditorEvents = referenceEditorEvents;
  });

  describe('onEntryCreate', function () {
    it('tracks entry create', function () {
      const contentType = getMockContentType();
      this.TheLocaleStore.getActiveLocales.returns([{}]);

      this.referenceEditorEvents.onEntryCreate({
        contentType,
        isInlineEditingEnabled: false
      });

      sinon.assert.calledWith(
        this.analytics.track,
        'reference_editor:create_entry',
        {
          fields_count: 2,
          locales_count: 1,
          localized_fields_count: 1,
          widgets_count: 2,
          inline_editing_toggled_on: false
        }
      );
    });
  });

  describe('onEntryEdit', function () {
    it('tracks entry edit', function () {
      const contentType = getMockContentType();
      this.TheLocaleStore.getActiveLocales.returns([{}]);

      this.referenceEditorEvents.onEntryEdit({ contentType });

      sinon.assert.calledWith(
        this.analytics.track,
        'reference_editor:edit_entry',
        {
          fields_count: 2,
          locales_count: 1,
          localized_fields_count: 1,
          widgets_count: 2
        }
      );
    });
  });

  describe('onToggleInlineEditor', function () {
    it('tracks inline bulk editor toggle ', function () {
      const contentType = getMockContentType();
      this.TheLocaleStore.getActiveLocales.returns([{}]);

      this.referenceEditorEvents.onToggleInlineEditor({
        contentType,
        toggleState: false
      });

      sinon.assert.calledWith(
        this.analytics.track,
        'reference_editor:toggle_inline_editor',
        {
          locales_count: 1,
          toggle_state: false
        }
      );
    });
  });
});

function getMockContentType () {
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
