'use strict';

describe('UserPersonaDialogController', function () {
  var analytics;
  beforeEach(function () {
    analytics = {
      track: sinon.spy(),
      addIdentifyingData: sinon.spy()
    };

    module('contentful/test', function($provide) {
      $provide.value('analytics', analytics);
    });
    var $controller = this.$inject('$controller');
    this.$timeout = this.$inject('$timeout');
    this.rootScope = this.$inject('$rootScope');

    this.scope = this.rootScope.$new();
    this.controller = $controller('UserPersonaDialogController', {
      $scope: this.scope,
      $attrs: {}
    });
  });

  describe('sets properties on the scope', function() {
    it('returns a CSM at random', function() {
      expect(typeof this.controller.csm.name).toBe('string');
      expect(this.controller.csm.avatar.endsWith('.jpg')).toBe(true);
    });

    it('populates persona options', function() {
      expect(Object.keys(this.controller.personaOptions).length).toBe(4);
    });
  });

  describe('make selection', function() {
    beforeEach(function() {
      this.scope.dialog = {
        confirm: _.noop,
        cancel: _.noop
      };
    });

    it('sends default option data to segment', function() {
      var objForSegment = {personaName: 'Coder'};

      this.controller.selectOption('code');
      sinon.assert.calledWith(analytics.addIdentifyingData, objForSegment);
      sinon.assert.calledWith(analytics.track, 'Selected Persona', objForSegment);
    });

    it('toggles view if other is clicked', function() {
      var personaId = 'other';
      expect(this.controller.showOtherText).toBe(false);
      this.controller.selectOption(personaId);
      expect(this.controller.showOtherText).toBe(true);
    });

    it('sends custom option data to segment', function() {
      var objForSegment = {
        personaName: 'Other',
        customPersonaName: 'Gardener'
      };

      this.controller.makeCustomSelection('Gardener');
      sinon.assert.calledWith(analytics.addIdentifyingData, objForSegment);
      sinon.assert.calledWith(analytics.track, 'Selected Persona', objForSegment);
    });

    it('tracks event if selection is skipped', function() {
      var eventName = 'Skipped Persona Selection';
      this.controller.skipSelection();
      sinon.assert.calledWith(analytics.track, eventName);
    });
  });
});
