'use strict';

angular.module('contentful')
.controller('UserPersonaDialogController', ['$injector', '$scope', function ($injector, $scope) {

  var controller   = this;
  var analytics    = $injector.get('analytics');

  // Display a random customer success manager
  controller.csm = getRandomCSM();

  // Get the preset persona options
  controller.personaOptions = getPersonaOptions();

  // User clicks to select an option
  controller.selectOption = function(opt) {
    if (opt === 'other') {
      controller.showOtherText = true;
    } else {
      makeSelection({personaName: opt});
    }
  };

  controller.showOtherText = false;

  controller.makeCustomSelection = function(customPersonaName) {
    return makeSelection({
      personaName: 'other',
      customPersonaName: customPersonaName
    });
  };

  controller.skipSelection = function () {
    // Send the skip selection tracking event
    analytics.track('Skipped Persona Selection');
    $scope.dialog.cancel();
  };

  function makeSelection (obj) {
    obj.personaName = getSegmentName(obj.personaName);

    // Remove unnecessary values from object
    var segmentObj = _.pick(obj, hasValue);

    // Add to user data, and track event
    analytics.addIdentifyingData(segmentObj);
    analytics.track('Selected Persona', segmentObj);

    $scope.dialog.confirm();

    // Returns true if val is a non-empty string, otherwise false
    function hasValue(val) {
      return typeof val === 'string' && val.length;
    }

    function getSegmentName(personaName) {
      var map = {
        code: 'Coder',
        content: 'Content Manager',
        project: 'Project Manager',
        other: 'Other'
      };
      return map[personaName];
    }
  }

  function getRandomCSM() {
    var csms = [
      { name: 'Meghan', avatar: '/app/images/csm-avatars/avatar-meghan.jpg' },
      { name: 'Inês', avatar: '/app/images/csm-avatars/avatar-ines.jpg' }
    ];

    return csms[_.random(csms.length-1)];
  }

  function getPersonaOptions() {
    return {
      code: {
        title: 'I write code',
        description: 'Developers, Technical PMs, CTOs',
        svg: 'icon-code'
      },
      content: {
        title: 'I work with content',
        description: 'Marketers, Editors, Content Strategists',
        svg: 'icon-content'
      },
      project: {
        title: 'I manage projects',
        description: 'Product/Project Managers',
        svg: 'icon-project'
      },
      other: {
        title: 'Other',
        description: 'An astronaut? Tell us more!',
        svg: 'icon-question-mark'
      }
    };
  }
}]);
