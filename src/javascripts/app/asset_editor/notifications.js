'use strict';

angular.module('contentful')
.factory('assetEditor/notifications', ['$injector', function ($injector) {
  var logger       = $injector.get('logger');
  var notification = $injector.get('notification');

  return function (getTitle) {
    return {
      deleteSuccess: function () {
        notification.info('Asset deleted successfully');
      },

      deleteFail: function (error) {
        notification.error('Error deleting Asset');
        logger.logServerWarn('Error deleting Asset', {error: error });
      },

      archiveSuccess: function () {
        notification.info(getTitle() + ' archived successfully');
      },

      archiveFail: function (error) {
        notification.error('Error archiving ' + getTitle() + ' (' + dotty.get(error, 'body.sys.id') + ')');
        logger.logServerWarn('Error archiving asset', {error: error });
      },

      unarchiveSuccess: function () {
        notification.info(getTitle() + ' unarchived successfully');
      },

      unarchiveFail: function (error) {
        notification.error('Error unarchiving ' + getTitle() + ' (' + dotty.get(error, 'body.sys.id') + ')');
        logger.logServerWarn('Error unarchiving asset', {error: error });
      },

      unpublishSuccess: function () {
        notification.info(getTitle() + ' unpublished successfully');
      },

      unpublishFail: function (error) {
        notification.error('Error unpublishing ' + getTitle() + ' (' + dotty.get(error, 'body.sys.id') + ')');
        logger.logServerWarn('Error unpublishing asset', {error: error });
      },

      publishSuccess: function () {
        notification.info(getTitle() + ' published successfully');
      },

      publishServerFail: function (error) {
        notification.error('Publishing the asset has failed due to a server issue. We have been notified.');
        logger.logServerWarn('Publishing the asset has failed due to a server issue. We have been notified.', {error: error });
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

