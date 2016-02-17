'use strict';

describe('cfOnboardingPersonaSelection directive', function() {

  var $scope, controller, stubs;

  beforeEach(function () {
    stubs = {
      analytics: {
        track: sinon.stub(),
        addIdentifyingData: sinon.stub()
      },
      $emit: sinon.stub()
    };

    module('contentful/test', function($provide) {
      $provide.value('analytics', stubs.analytics);
    });

    var element = this.$compile('<cf-onboarding-persona-selection>', {
      $emit: stubs.$emit
    });
    $scope = element.scope();
    controller = $scope.personaController;
  });

  describe('sets properties on the scope', function() {
    it('populates persona options', function() {
      expect(Object.keys(controller.personaOptions).length).toBe(4);
    });
  });

  describe('#submitPersonaSelection', function() {
    beforeEach(function() {
      $scope.dialog = {
        confirm: _.noop,
        cancel: _.noop
      };
    });

    it('sends values to segment', function() {
      var segmentObj = {
        personaName: 'Coder'
      };

      controller.selectOption('code');
      controller.customPersonaName = '';
      controller.submitPersonaSelection();

      sinon.assert.calledWith(stubs.analytics.addIdentifyingData, segmentObj);
      sinon.assert.calledWith(stubs.analytics.track, 'Selected Persona', segmentObj);
    });

    it('toggles view if other is clicked', function() {
      var personaId = 'other';
      expect(controller.showOtherText).toBe(false);
      controller.selectOption(personaId);
      expect(controller.showOtherText).toBe(true);
    });

    it('sends custom persona data to segment', function() {
      var segmentObj = {
        personaName: 'Other',
        customPersonaName: 'Gardener'
      };
      controller.selectedPersona = 'other';
      controller.customPersonaName = 'Gardener';
      controller.submitPersonaSelection();
      sinon.assert.calledWith(stubs.analytics.addIdentifyingData, segmentObj);
      sinon.assert.calledWith(stubs.analytics.track, 'Selected Persona', segmentObj);
    });

    it('emits submitPersonaSelection event', function() {
      controller.selectOption('code');
      controller.customPersonaName = '';
      controller.submitPersonaSelection();
      sinon.assert.calledWith(stubs.$emit, 'submitPersonaSelection');
    });

  });

  describe('#skipSelection', function() {
    beforeEach(function() {
      controller.skipSelection();
    });
    it('tracks event if selection is skipped', function() {
      var eventName = 'Skipped Persona Selection';
      sinon.assert.calledWith(stubs.analytics.track, eventName);
    });
    it('emits skipPersonaSelection event', function() {
      sinon.assert.called(stubs.$emit);
      sinon.assert.calledWith(stubs.$emit, 'skipPersonaSelection');
    });
  });
});