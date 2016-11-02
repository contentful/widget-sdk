'use strict';

describe('Tracking field events', function () {
  beforeEach(function () {
    module('contentful/test');

    this.track = this.$inject('analyticsEvents/fields');
    this.analytics = this.$inject('analytics');
    sinon.stub(this.analytics, 'track');
  });

  describe('#added', function () {
    const CONTENT_TYPE = {
      getId: _.constant('CT_ID'),
      getName: _.constant('CT_NAME')
    };

    const FIELD = {
      id: 'FIELD_ID',
      name: 'FIELD_NAME',
      type: 'FIELD_TYPE',
      localized: true,
      required: true
    };

    it('has tracking data built from content type and field and action', function () {
      this.track.added(CONTENT_TYPE, FIELD);

      sinon.assert.calledOnce(this.analytics.track);
      expect(this.analytics.track.firstCall.args[0]).toBe('Modified ContentType');

      expect(this.analytics.track.firstCall.args[1]).toEqual({
        contentTypeId: 'CT_ID',
        contentTypeName: 'CT_NAME',
        fieldId: 'FIELD_ID',
        fieldName: 'FIELD_NAME',
        fieldType: 'FIELD_TYPE',
        fieldSubtype: null,
        fieldLocalized: FIELD.localized,
        fieldRequired: FIELD.required,
        action: 'add'
      });
    });
  });
});
