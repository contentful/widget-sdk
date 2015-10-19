'use strict';

angular.module('contentful')
.factory('EntityStateManager', ['$q', function ($q) {
  function StateManager (entity) {
    this.entity = entity;
  }

  /**
   * @description
   * Returns the current server state of the entity.
   *
   * May either be 'archvived', 'draft', or 'published'.
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
      return 'published';
    } else {
      return 'draft';
    }
  };

  /**
   * @description
   * Returns the current editing state.
   *
   * This differs from `getState()` in that it also may return
   * 'changed' if the entity has been published, but the current
   * version is different from the published one.
   *
   * @returns {string}
   */
  StateManager.prototype.getEditingState = function () {
    if (this._lockedEditingState) {
      return this._lockedEditingState;
    }
    if (this.entity.isPublished() && this.entity.hasUnpublishedChanges()) {
      return 'changes';
    } else {
      return this.getState();
    }
  };

  StateManager.prototype.archive = function () {
    var entity = this.entity;
    return this._withLockedState(function () {
      var unpublish = $q.when();
      if (entity.isPublished()) {
        unpublish = entity.unpublish();
      }

      return unpublish.then(function () {
        return entity.archive();
      });
    });
  };

  StateManager.prototype.publish = function () {
    var entity = this.entity;
    return this._withLockedState(function () {
      var unarchive = $q.when();
      if (entity.isArchived()) {
        unarchive = entity.unarchive();
      }

      return unarchive.then(function () {
        return entity.publish();
      });
    });
  };

  StateManager.prototype.toDraft = function () {
    var state = this.getState();
    var entity = this.entity;
    return this._withLockedState(function () {
      if (state === 'published') {
        return entity.unpublish();
      } else if (state === 'archived') {
        return entity.unarchive();
      } else {
        return $q.when();
      }
    });
  };

  StateManager.prototype.delete = function () {
    var entity = this.entity;
    return this._withLockedState(function () {
      var unpublish = $q.when();
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
    this._lockedState = this.getState();
    this._lockedEditingState = this.getEditingState();
    return action()
    .finally(function () {
      self._lockedState = null;
      self._lockedEditingState = null;
    });
  };

  return StateManager;
}]);

