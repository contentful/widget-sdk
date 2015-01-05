'use strict';

angular.module('contentful').controller('SlugEditorController', [
  '$scope', '$injector', function ($scope, $injector) {

  var slugUtils = $injector.get('slug');

  var spaceContext = $scope.spaceContext,
      currentLocale = $scope.locale, //locale for slug widget
      defaultLocale = spaceContext.defaultLocale,
      unwatchers = [];

  $scope.$watch('otEditable', function (otEditable) {
    if (otEditable) {
      unwatchers.push($scope.$watch('entry.isPublished()', updateDivergedStatus));
      unwatchers.push($scope.$watch('fieldData.value', updateStateFromSlug));
      unwatchers.push($scope.$watch(currentTitle, updateSlugFromTitle));
    } else if (unwatchers.length) {
      unwatchers.forEach(function (unwatch) {
        unwatch();
      });
      unwatchers.length = 0;
    }
  });

  /**
   * Sets the slug to a new value through OT-friendly string updating.
   */
  function setSlug(value) {
    $scope.otChangeStringP(value).then(function() {
      $scope.fieldData.value = $scope.otGetValue();
    });
  }

  /**
   * Checks if the slug and title have diverged, and stores
   * that in $scope.hasDiverged.
   * If the slug is not the ID, and also not representative of the title,
   * then mark it as diverged.
   * If the entry is already published, then the slug should not be changed
   * automatically, hence that is also treated as divergence.
   */
  function updateDivergedStatus() {
    if ($scope.hasDiverged) {
      return;
    }

    var value = $scope.fieldData.value;

    if ($scope.entry.isPublished() ||
        value &&
        value !== $scope.entry.getId() &&
        value !== slugUtils.slugify(currentTitle(), $scope.locale.code)) {
      $scope.hasDiverged = true;
    }
  }

  /**
   * Resets the slug's uniqueness state to 'checking' and requests
   * information about uniqueness from the server.
   */
  function updateStateFromSlug() {
    updateDivergedStatus();
  }

  /**
   * State machine for binding the slug to the entry's title. This
   * call is run whenever the title changes, and as long as the slug
   * has not already diverged:
   * 1. If no title is provided, the slug string is the entry's ID.
   * 2. If a title is provided, the slug is updated to match the current title.
   */
  function updateSlugFromTitle(currentTitle) {
    if ($scope.hasDiverged) {
      return;
    }

    if (!currentTitle) {
      setSlug($scope.entry.getId());
    } else {
      setSlug(slugUtils.slugify(currentTitle, $scope.locale.code));
    }
  }

  /**
   * Returns the title of the entry in the current scope. If a title in the
   * current locale is unavailable, the default locale is tried. If no
   * title exists, null is returned.
   */
  function currentTitle() {
    return spaceContext.entryTitle($scope.entry, currentLocale.code, true) ||
           spaceContext.entryTitle($scope.entry, defaultLocale.code, true);
  }
}]);
