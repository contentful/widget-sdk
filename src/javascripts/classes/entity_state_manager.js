'use strict';

angular.module('contentful')
.factory('EntityStateManager', ['require', function (require) {
  var $q = require('$q');

  /**
   * @ngdoc type
   * @name StateManager
   * @description
   * A class to manage the state of an entity atomically.
   *
   * @property {Signal<string, string>} changedEditingState
   */
  function StateManager (entity, trackChange) {
    this.trackChange = trackChange;
    this.entity = entity;
  }

  /**
   * @ngdoc method
   * @name StateManager#getState
   * @description
   * Returns the current server state of the entity.
   *
   * May either be 'archvived', 'draft', 'changes', or 'published'.
   *
   * It returns 'changes' if the entity has been published, but the current
   * version is different from the published one.
   *
   * @returns {string}
   */
  StateManager.prototype.getState = function () {
    if (this._lockedState) {
      return this._lockedState;
    }

    if (this.entity.isArchived()) {
      return 'archived';
    } else if (this.entity.isPublished()) {
      if (this.entity.hasUnpublishedChanges()) {
        return 'changes';
      } else {
        return 'published';
      }
    } else {
      return 'draft';
    }
  };

  /**
   * @ngdoc method
   * @name StateManager#archive
   * @returns {Promise<void>}
   */
  StateManager.prototype.archive = function () {
    var entity = this.entity;
    return this._withLockedState(function () {
      var unpublish = $q.resolve();
      if (entity.isPublished()) {
        unpublish = entity.unpublish();
      }

      return unpublish.then(function () {
        return entity.archive();
      });
    });
  };

  /**
   * @ngdoc method
   * @name StateManager#publish
   * @returns {Promise<void>}
   */
  StateManager.prototype.publish = function () {
    var entity = this.entity;
    return this._withLockedState(function () {
      var unarchive = $q.resolve();
      if (entity.isArchived()) {
        unarchive = entity.unarchive();
      }

      return unarchive.then(function () {
        return entity.publish();
      });
    });
  };

  /**
   * @ngdoc method
   * @name StateManager#toDraft
   * @returns {Promise<void>}
   */
  StateManager.prototype.toDraft = function () {
    var state = this.getState();
    var entity = this.entity;
    return this._withLockedState(function () {
      if (state === 'published') {
        return entity.unpublish();
      } else if (state === 'archived') {
        return entity.unarchive();
      } else {
        return $q.resolve();
      }
    });
  };

  /**
   * @ngdoc method
   * @name StateManager#delete
   * @returns {Promise<void>}
   */
  StateManager.prototype.delete = function () {
    var entity = this.entity;
    return this._withLockedState(function () {
      var unpublish = $q.resolve();
      if (entity.isPublished()) {
        unpublish = entity.unpublish();
      }

      return unpublish.then(function () {
        return entity.delete();
      });
    });
  };


  StateManager.prototype._withLockedState = function (action) {
    var self = this;
    var lockedState = this.getState();
    this._lockedState = lockedState;
    return action()
    .finally(function () {
      self._lockedState = null;
    })
    .then(function () {
      self.trackChange(lockedState, self.getState());
    });
  };

  return StateManager;
}]);
