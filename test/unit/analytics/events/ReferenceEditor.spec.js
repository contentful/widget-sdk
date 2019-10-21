import sinon from 'sinon';

describe('ReferenceEditor', () => {
  beforeEach(async function() {
    this.analytics = {
      track: sinon.stub()
    };

    this.TheLocaleStore = {
      getActiveLocales: sinon.stub()
    };

    this.system.set('services/localeStore.es6', {
      default: this.TheLocaleStore
    });

    this.system.set('analytics/Analytics', this.analytics);

    const referenceEditorEvents = await this.system.import('analytics/events/ReferenceEditor');

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
