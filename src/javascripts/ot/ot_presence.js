'use strict';

angular.module('contentful').

  value('otPresenceConfig', {
    focusThrottle: 10e3,
    pingTimeout: 60e3
  }).

  /**
   * @ngdoc type
   * @name otDocPresenceController
   * @property {Object} otPresence
   * @description
   * This controller listens to events on the otDoc and populates an otPresence
   * object with information about which users are editing which fields on the
   * current document.
   *
   * Internally, this controller is watching for the existence of otDoc. When
   * otDoc is present, an event listener is set on otDoc (see otDocChangeHandler).
   * When the shout event is handled, the internal presence variable is updated.
   * This presence variable is also being watched, and when it's changed,
   * the watcher updates the otPresence property on the scope.
  */
  controller('otDocPresenceController', ['$scope', '$timeout', 'otPresenceConfig', function($scope, $timeout, otPresenceConfig) {
    var controller = this;
    var presence = {};
    var ownPresence = {};
    var ownUserId = $scope.user.sys.id;
    var timeout;
    var lastFieldId;
    var lastFocus;

    $scope.$watch('otDoc.doc', otDocChangeHandler);
    $scope.$on('$stateChangeStart', stateChangeStartHandler);
    $scope.$on('$destroy', destroyHandler);

    $scope.$watch(function() {
      return presence;
    }, function(presence) {
      $scope.otPresence = {
        fields: groupPresenceByField(presence),
        users: presenceUsers(presence)
      };
    }, true);

    doLater();

    /**
     * @ngdoc method
     * @name focus
     * @param {string} fieldId
    */
    controller.focus = function(fieldId) {
      var now = new Date();
      if (fieldId === lastFieldId && now - lastFocus < otPresenceConfig.focusThrottle) return;
      lastFieldId = fieldId;
      lastFocus = now;
      ownPresence.focus = fieldId;
      var doc = $scope.otDoc.doc;
      if (!doc) return;
      doc.shout(['focus', ownUserId, fieldId]);
    };

    function doLater() {
      removeTimedOutUsers();
      timeout = $timeout(doLater, otPresenceConfig.pingTimeout);
    }

    function removeTimedOutUsers() {
      var timedOutUsers = _(presence).map(function(p, u) {
        var timeSinceLastShout = new Date() - p.shoutedAt;
        var timedOut = timeSinceLastShout > otPresenceConfig.pingTimeout;
        if (timedOut) return u;
      }).compact().value();

      _.forEach(timedOutUsers, function(u) {
        delete presence[u];
      });
    }

    function stateChangeStartHandler() {
      var docExists = !!($scope.otDoc.doc);
      if (!docExists) { return; }
      closedHandler($scope.otDoc.doc);
    }

    function otDocChangeHandler(doc, old) {
      if (old) {
        old.removeListener('closed', closedHandler);
        old.removeListener('shout', shoutHandler);
      }

      if (!doc) return;

      doc.shout(['open', ownUserId]);
      doc.on('shout', shoutHandler);
    }

    function closedHandler(doc) {
      /*jshint validthis:true */
      if(doc) doc.shout(['close', ownUserId]);
      $timeout.cancel(timeout);
    }

    function shoutHandler(shout) {
      $scope.$apply(function(scope) {
        var type   = shout[0];
        var from   = shout[1];
        var focusedFieldId = shout[2];

        if (!presence[from]) presence[from] = {};

        presence[from].shoutedAt = new Date();

        if (type === 'open') {
          if (ownPresence.focus)
            scope.otDoc.doc.shout(['focus', ownUserId, ownPresence.focus]);
          else
            scope.otDoc.doc.shout(['ping', ownUserId]);
          presence[from] = {};
        }

        if (type === 'ping') {}

        if (type === 'focus') {
          presence[from].focus = focusedFieldId;
        }

        if (type === 'close')
          delete presence[from];
      });
    }

    function groupPresenceByField(presence) {
      return _.reduce(presence, function(fields, userPresence, presenceUserId) {
        var field = userPresence.focus;
        if (!field) return fields;
        if (!fields[field]) fields[field] = {users: []};
        fields[field].users.push(toUserLink(presenceUserId));
        return fields;
      }, {});
    }

    function presenceUsers(presence) {
      return _(presence).keys().map(toUserLink).value();
    }

    function toUserLink(id) {
      return {sys: {type: 'Link', linkType: 'User', id: id}};
    }

    function destroyHandler(event) {
      var scope = event.currentScope;
      controller.focus = null;
      $timeout.cancel(timeout);
      if (scope.otDoc.doc) {
        scope.otDoc.doc.removeListener('closed', closedHandler);
        scope.otDoc.doc.removeListener('shout', shoutHandler);
      }
    }

  }]).

  /**
   * @ngdoc directive
   * @name otDocPresence
  */
  directive('otDocPresence', function() {
    return {
      require: '^otDocFor',
      controller: 'otDocPresenceController'
    };
  }).

  /**
   * @ngdoc type
   * @name otFieldPresenceController
   * @scope.requires otPresence
   * @property {string} otFieldPresenceId
   * @property {object} otFieldPresence
   * @description
   * This controller looks for information about the current field in the document
   * presence and populates some properties to indicate the current field presence
  */
  controller('otFieldPresenceController', ['$scope', '$attrs', function($scope, $attrs) {
    var unregister;
    $scope.$watch($attrs.otFieldPresence, function(v) {
      var id = $scope.otFieldPresenceId = v.join('.');
      var fp = 'otPresence.fields["' + id + '"]';
      if (unregister) unregister();
      unregister = $scope.$watch(fp, function (fp) {
        $scope.otFieldPresence = fp;
      });
    }, true);
  }]).

  /**
   * @ngdoc directive
   * @name otFieldPresence
  */
  directive('otFieldPresence', function() {
    return {
      require: '^otDocPresence',
      controller: 'otFieldPresenceController',
      link: function(scope, element, attrs, otPresenceController) {
        function focus() {
          if (!scope.otFieldPresenceId) return;
          otPresenceController.focus(scope.otFieldPresenceId);
        }

        element.on('focus keydown', 'input, textarea', focus);
      }
    };
  });
