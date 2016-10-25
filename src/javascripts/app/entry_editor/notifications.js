'use strict';

angular.module('contentful')
.factory('entryEditor/notifications', ['require', function (require) {
  var logger = require('logger');
  var notification = require('notification');

  return function (getTitle) {
    return {
      archiveSuccess: function () {
        notification.info(getTitle() + ' archived successfully');
      },

      archiveFail: function (error) {
        notification.error('Error archiving ' + getTitle() + ' (' + dotty.get(error, 'body.sys.id') + ')');
        logger.logServerWarn('Error archiving entry', {error: error});
      },

      unarchiveSuccess: function () {
        notification.info(getTitle() + ' unarchived successfully');
      },

      unarchiveFail: function (error) {
        notification.error('Error unarchiving ' + getTitle() + ' (' + dotty.get(error, 'body.sys.id') + ')');
        logger.logServerWarn('Error unarchiving entry', {error: error});
      },

      duplicateFail: function (error) {
        notification.error('Could not duplicate Entry');
        logger.logServerWarn('Could not duplicate Entry', {error: error});
      },

      deleteSuccess: function () {
        notification.info('Entry deleted successfully');
      },

      deleteFail: function (error) {
        notification.error('Error deleting Entry');
        logger.logServerWarn('Error deleting Entry', {error: error});
      },

      revertToPreviousSuccess: function () {
        notification.info('Entry reverted to the previous state successfully');
      },

      revertToPreviousFail: function (error) {
        notification.error('Error reverting to the previous state of ' + getTitle() + ' (' + dotty.get(error, 'body.sys.id') + ')');
        logger.logSharejsWarn('Error reverting entry to previous state', {error: error});
      },

      unpublishSuccess: function () {
        notification.info(getTitle() + ' unpublished successfully');
      },

      unpublishFail: function (error) {
        notification.error('Error unpublishing ' + getTitle() + ' (' + dotty.get(error, 'body.sys.id') + ')');
        logger.logServerWarn('Error unpublishing entry', {error: error});
      },

      publishSuccess: function () {
        notification.info(getTitle() + ' published successfully');
      },

      publishServerFail: function (error) {
        notification.error('Publishing the entry has failed due to a server issue. We have been notified.');
        logger.logServerWarn('Publishing the entry has failed due to a server issue. We have been notified.', {error: error});
      },

      publishFail: function (message) {
        notification.error('Error publishing ' + getTitle() + ': ' + message);
      },

      publishValidationFail: function () {
        notification.error('Error publishing ' + getTitle() + ': ' + 'Validation failed. ' +
                           'Please check the individual fields for errors.');
      }
    };
  };
}]);
