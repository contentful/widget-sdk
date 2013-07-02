'use strict';

angular.module('contentful').controller('SaveStatusCtrl', function ($scope) {
  $scope.saveStatus = 'no_connection';

  $scope.$watch(function (scope) {
    if (scope.otDoc) {
      if (scope.saving) {
        scope.saveStatus = 'saving';
      } else if(typeof scope.saving == 'undefined'){
        scope.saveStatus = 'last-saved-at';
        var updatedAt = scope.otGetEntity().data.sys.updatedAt;
        scope.lastSavedAt = moment(updatedAt).fromNow();
      } else {
        scope.saveStatus = 'saved';
      }
    } else {
      if (scope.otDisabled) {
        scope.saveStatus = 'not-allowed';
      } else {
        scope.saveStatus = 'no-connection';
        // TODO distinction between connecting and stopped according to sharejs connection state
      }
    }
  });

////////////////////////////////////////////////////////////////////////////////
//  Everything below is just to figure out from the ShareJS events when a
//  saving is in progress. It does some weird magic with event timing to achieve
//  both an actual detection of local changes vs. remote and some delay so that
//  the state doesn't flicker too much
////////////////////////////////////////////////////////////////////////////////

  var detachHandlers;

  $scope.$watch('otDoc', function (doc) {
    if (detachHandlers) detachHandlers();

    if (doc) {
      doc.on('change',     changeHandler);
      doc.on('remoteop', remoteopHandler);
      doc.on('change',       stopHandler);
      var _doc = doc;

      detachHandlers = function () {
        _doc.removeListener('change',      changeHandler);
        _doc.removeListener('remoteop',  remoteopHandler);
        _doc.removeListener('change',        stopHandler);
        _doc = null;
        detachHandlers = null;
      };
    }
  });

  var lastOp, saveStartTime, willBeSaving, willBeStopping;

  var stopImmediate = function () {
    saveStartTime = null;
    $scope.saving = false;
    $scope.$digest();
  };

  function changeHandler(op) {
    startSave('change', op);
  }

  function remoteopHandler(op) {
    startSave('remoteop', op);
  }

  function stopHandler() {
    stopSave();
  }

  // A local or remote change triggers a 'change' event here
  // op gets saved, time saved
  // in the next tick, we set the saving flag to true
  //
  // else:
  // if the change was caused remotely, not locally:
  //  cancel setting the saving flag to true
  //  reset save start time
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

  // gets called immediately when a change happens
  // if the start of a saving process was recorded earlier,
  //   determine how much time has passed
  //   if more than 900 ms have passed, reset saving flag
  //   if less than 900 ms have passed, retry again after the remaining time
  // if no saving process has started yet
  //   retry stopping in 900ms
  function stopSave() {
    if (!saveStartTime) {
      clearTimeout(willBeStopping);
      willBeStopping = setTimeout(stopSave, 900);
      // TODO is it really necessary to create this endless loop here?
      //      won't the timout be triggered automatically again as soon
      //      as the next change event comes in?
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
  }

  $scope.$on('destroy', function () {
    if (detachHandlers) detachHandlers();
    clearTimeout(willBeSaving);
    clearTimeout(willBeStopping);
  });

  // A bit more explanation (See bottom for TL;DR)
  //
  // Scenario 1: Local change
  // - startSave gets called with 'change' and the op
  //   - startTime, op gets recorded
  //   - saving state is queued
  // - stopSave is called
  //   - 900ms haven't passed yet
  //   - will try again in 900ms
  // NEXT TICK
  // - saving state is set to true
  // 900ms later
  // - stopSave is called
  //   - resets saving state
  //   - clears startTime
  //
  // Scenario 2: 2 Local changes
  //
  // - startSave gets called with 'change' and the op
  //   - startTime, op gets recorded
  //   - saving state is queued
  // - stopSave is called
  //   - 900ms haven't passed yet
  //   - will try again in 900ms
  // NEXT TICK
  // - saving state is set to true
  // At 200ms
  // - startSave gets called with 'change' and the second op
  //   - startTime is updated to 200ms later
  //   - last op is recorded
  //   - saving state is queued
  // - stopSave get called with change and the second op
  //   - 900ms haven't passed yet
  //   - the timeout from the first op is stopped
  //   - a new timeout is set from the upated saveStartTime
  // NEXT TICK
  // - saving state is set to true, again
  // 900ms later
  // - stopSave is called
  //   - resets saving state
  //   - clears startTime
  //
  // Scenario 3: Remote change
  //
  // - startSave gets called with 'change' and the op
  //   - startTime, op gets recorded
  //   - saving state is queued
  // - stopSave is called
  //   - 900ms haven't passed yet
  //   - will try again in 900ms
  // - startSave gets called with 'remoteOp' and the same op
  //   - the queue for setting the saving state is cleared
  //   - saveStartTime is cleared since we didn't actually start saving
  // 900ms later
  // - if, in the meantime no other actual saving operation was started
  //   saveStarttime will be null
  //   - we will try again in 900ms
  //
  // TL;DR
  //
  // stopSave
  // So, every 900ms it tests wether we started a saving operation
  // If we started a saving operation the timeout is extended so that it
  // times out 900ms after the last operation
  //
  // startSave
  // Determining wether a change was remote or local relies on the fact that
  // within one tick a remote operating causes TWO events, "change" and "remoteOp"
  // so, in startSave we wait for the remoteOp before actually doing anything.
});
