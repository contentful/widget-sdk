'use strict';

angular.module('contentful/controllers').controller('SaveStatusCtrl', function ($scope) {
  $scope.saveStatus = 'no_connection';

  var detachHandlers;

  $scope.$watch('doc', function (doc) {
    if (detachHandlers) detachHandlers();

    if (doc) {
      var changeListener = doc.on('change',   function (op) { startSave('change'  , op); });
      var remoteListener = doc.on('remoteop', function (op) { startSave('remoteop', op); });
      var ackListener    = doc.on('change',   function () { stopSave(); });
      var _doc = doc;

      detachHandlers = function () {
        _doc.removeEventListener(changeListener);
        _doc.removeEventListener(remoteListener);
        _doc.removeEventListener(ackListener);
        ackListener = changeListener = remoteListener = detachHandlers = _doc = null;
      };
    }
  });

  $scope.$watch(function (scope) {
    if (scope.doc) {
      if (scope.editable === false) {
        scope.saveStatus = 'not-allowed';
      } else if (scope.saving) {
        scope.saveStatus = 'saving';
      } else {
        scope.saveStatus = 'saved';
      }
    } else {
      if (scope.otDisabled) {
        scope.saveStatus = 'not-allowed';
      } else {
        scope.saveStatus = 'no-connection';
      }
    }
  });

  $scope.$on('destroy', function () {
    detachHandlers();
  });

  var lastOp, saveStartTime, willBeSaving, willBeStopping;

  var stopImmediate = function () {
    saveStartTime = null;
    $scope.saving = false;
    $scope.$digest();
  };

  function startSave(event, op) {
    if (event === 'change') {
      lastOp = op;
      saveStartTime = new Date();
      willBeSaving = _.defer(function () {
        $scope.saving = true;
        $scope.$digest();
      });
    } else if (op === lastOp) { // last 'change' was a remote op
      clearTimeout(willBeSaving); //immediately abort the switch to 'saving' state
      willBeSaving = null;
      saveStartTime = null;
    }
  }

  var stopSave = function () {
    if (!saveStartTime) {
      clearTimeout(willBeStopping);
      willBeStopping = setTimeout(stopSave, 900);
    } else {
      var now = new Date();
      var timePassed = now - saveStartTime;
      if (timePassed > 900) {
        stopImmediate();
      } else {
        clearTimeout(willBeStopping);
        willBeStopping = setTimeout(stopSave, 900 - timePassed);
      }
    }
  };
});
