'use strict';

angular.module('contentful').factory('presence', ['$rootScope', 'debounce', function ($rootScope, debounce) {
  // Code related to the hidden Property is from http://www.html5rocks.com/en/tutorials/pagevisibility/intro/
  
  function watchVisibility() {
    var visProp = getHiddenProp();
    if (visProp) {
      var evtname = visProp.replace(/[H|h]idden/,'') + 'visibilitychange';
      $(document).on(evtname, visibilityChangeHandler);
    }
  }

  function visibilityChangeHandler() {
    var oldHidden = hidden,
        newHidden = isHidden();
    if (newHidden !== oldHidden) {
      hidden = newHidden;
      $rootScope.$apply(function () {
        $rootScope.$broadcast('presenceChanged', newHidden, oldHidden);
      });
    }
  }

  function isHidden() {
    var prop = getHiddenProp();
    if (!prop) return false;

    return document[prop];
  }

  var hidden = isHidden();

  function getHiddenProp(){
    var prefixes = ['webkit','moz','ms','o'];

    // if 'hidden' is natively supported just return it
    if ('hidden' in document) return 'hidden';

    // otherwise loop over all the known prefixes until we find one
    for (var i = 0; i < prefixes.length; i++){
      if ((prefixes[i] + 'Hidden') in document)
        return prefixes[i] + 'Hidden';
    }

    // otherwise it's not supported
    return null;
  }

  watchVisibility();

  var lastActive = Date.now();

  var trackActivity = debounce(function() {
    lastActive = Date.now();
  }, 1000 * 10);

  $(document).on('keydown mousemove', trackActivity);

  return {
    isHidden: function () {
      return hidden;
    },

    lastActive: function () {
      return lastActive;
    },

    timeOut: 1000 * 60 * 10,

    isActive: function () {
      var now = Date.now();
      return !this.isHidden() && (now - lastActive < this.timeOut);
    }
  };
}]);
