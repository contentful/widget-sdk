'use strict';

describe('analyticsEvents', function () {

  var analyticsTrackSpy;
  var analyticsEvents;

  beforeEach(function () {
    analyticsTrackSpy = sinon.spy();

    module('contentful/test', function ($provide) {
      $provide.value('analytics', {
        track: analyticsTrackSpy
      });
    });

    analyticsEvents = this.$inject('analyticsEvents');
  });

  it('should track knowledgeBase clicks', function () {
    analyticsEvents.trackFollowedKbpLink('sectionName');
    sinon.assert.calledWith(analyticsTrackSpy, 'Clicked KBP link', {section: 'sectionName'});
  });

  describe('trackContentTypeChange()', function () {
    var EVENT = 'Herp';
    var ACTION = 'derp';
    var CONTENT_TYPE = {
      getId: _.constant('CT_ID'),
      getName: _.constant('CT_NAME')
    };
    var FIELD = {
      id: 'FIELD_ID',
      name: 'FIELD_NAME',
      type: 'FIELD_TYPE',
      localized: true,
      required: true
    };

    beforeEach(function () {
      analyticsEvents.trackContentTypeChange(EVENT, CONTENT_TYPE, FIELD, ACTION);
    });

    it('tracks an event with the name given as first parameter', function () {
      expect(analyticsTrackSpy.args[0][0]).toBe(EVENT);
    });

    it('has tracking data built from content type, field and action', function () {
      expect(analyticsTrackSpy.args[0][1]).toEqual({
        contentTypeId: 'CT_ID',
        contentTypeName: 'CT_NAME',
        fieldId: 'FIELD_ID',
        fieldName: 'FIELD_NAME',
        fieldType: 'FIELD_TYPE',
        fieldSubtype: null,
        fieldLocalized: FIELD.localized,
        fieldRequired: FIELD.required,
        action: ACTION
      });
    });
  });

  describe('toggleAuxPanel()', function () {
    it('tracks having opened the Aux-Panel', function () {
      analyticsEvents.trackToggleAuxPanel(true, 'someStateName');
      sinon.assert.calledWithExactly(analyticsTrackSpy, 'Opened Aux-Panel', {
        currentState: 'someStateName'
      });
    });

    it('tracks having closed the Aux-Panel', function () {
      analyticsEvents.trackToggleAuxPanel(false, 'someStateName');
      sinon.assert.calledWithExactly(analyticsTrackSpy, 'Closed Aux-Panel', {
        currentState: 'someStateName'
      });
    });
  });
});
