'use strict';

describe('cfOnboardingPersonaSelection directive', function() {

  var $scope, controller, stubs;

  afterEach(function () {
    $scope = controller = stubs = null;
  });

  beforeEach(function () {
    stubs = {
      $emit: sinon.stub()
    };

    module('contentful/test', function($provide) {
      $provide.value('analyticsEvents', {
        persona: {
          trackSelected: sinon.spy(),
          trackSkipped: sinon.spy()
        }
      });
    });

    this.analytics = this.$inject('analyticsEvents')

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
      controller.submitPersonaSelection('code');
      sinon.assert.calledWith(this.analytics.persona.trackSelected, 'code');
    });

    it('emits submitPersonaSelection event', function() {
      controller.selectOption('code');
      controller.submitPersonaSelection();
      sinon.assert.calledWith(stubs.$emit, 'submitPersonaSelection');
    });

  });

  describe('#skipSelection', function() {
    beforeEach(function() {
      controller.skipSelection();
    });
    it('tracks event if selection is skipped', function() {
      sinon.assert.calledWith(this.analytics.persona.trackSkipped);
    });
    it('emits skipPersonaSelection event', function() {
      sinon.assert.called(stubs.$emit);
      sinon.assert.calledWith(stubs.$emit, 'skipPersonaSelection');
    });
  });
});
