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
        contentType
      });

      sinon.assert.calledWith(this.analytics.track, 'reference_editor:create_entry', {
        fields_count: 2,
        locales_count: 1,
        localized_fields_count: 1,
        widgets_count: 2,
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
        widgets_count: 2,
        version: 2
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
