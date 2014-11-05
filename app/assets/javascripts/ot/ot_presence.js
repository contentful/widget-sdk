'use strict';

angular.module('contentful').
  directive('otDocPresence', function() {
    return {
      require: '^otDocFor',
      controller: 'otDocPresenceController'
    };
  }).

  value('otPresenceConfig', {
    focusThrottle: 10e3,
    pingTimeout: 60e3
  }).

  controller('otDocPresenceController', ['$scope', '$timeout', 'otPresenceConfig', function($scope, $timeout, otPresenceConfig) {
    var presence = {};
    var ownPresence = {};
    var user  = $scope.user.sys.id;
    var timeout;

    $scope.$watch(function() {
      return presence;
    }, function(presence) {
      $scope.presence = {
        fields: groupPresenceByField(presence),
        users: presenceUsers(presence)
      };
    }, true);

    function closedHandler(doc) {
      /*jshint validthis:true */
      if(doc) doc.shout(['close', user]);
      $timeout.cancel(timeout);
    }

    function shoutHandler(shout) {
      $scope.$apply(function(scope) {
        var type = shout[0];
        var from = shout[1];

        if (!presence[from]) presence[from] = {};

        presence[from].shoutedAt = new Date();

        if (type === 'open') {
          if (ownPresence.focus)
            scope.otDoc.shout(['focus', user, ownPresence.focus]);
          else
            scope.otDoc.shout(['ping', user]);
          presence[from] = {};
        }

        if (type === 'ping') {}

        if (type === 'focus') {
          var id = shout[2];
          presence[from].focus = id;
        }

        if (type === 'close')
          delete presence[from];
      });
    }

    $scope.$watch('otDoc', function(doc, old) {
      if (old) {
        old.removeListener('closed', closedHandler);
        old.removeListener('shout', shoutHandler);
      }

      if (!doc) return;

      doc.shout(['open', user]);
      doc.on('shout', shoutHandler);
    });

    $scope.$on('tabClosed', function(event, tab) {
      var isOwnTab = (tab === $scope.tab);
      var docExists = 'otDoc' in $scope;
      if (!isOwnTab || !docExists) { return; }
      closedHandler($scope.otDoc);
    });

    var lastId;
    var lastFocus;
    this.focus = function(id) {
      var now = new Date();
      if (id === lastId && now - lastFocus < otPresenceConfig.focusThrottle) return;
      lastId = id;
      lastFocus = now;
      ownPresence.focus = id;
      var doc = $scope.otDoc;
      if (!doc) return;
      doc.shout(['focus', user, id]);
    };

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

    function doLater() {
      removeTimedOutUsers();
      timeout = $timeout(doLater, otPresenceConfig.pingTimeout);
    }

    doLater();

    var controller = this;
    $scope.$on('$destroy', function(event) {
      var scope = event.currentScope;
      controller.focus = null;
      $timeout.cancel(timeout);
      if (scope.otDoc) {
        scope.otDoc.removeListener('closed', closedHandler);
        scope.otDoc.removeListener('shout', shoutHandler);
      }

    });

    function groupPresenceByField(presence) {
      return _.reduce(presence, function(fields, userPresence, user) {
        var field = userPresence.focus;
        if (!field) return fields;
        if (!fields[field]) fields[field] = {users: []};
        fields[field].users.push(toUserLink(user));
        return fields;
      }, {});
    }

    function presenceUsers(presence) {
      return _(presence).keys().map(toUserLink).value();
    }

    function toUserLink(id) {
      return {sys: {type: 'Link', linkType: 'User', id: id}};
    }

  }]).

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
  }).

  controller('otFieldPresenceController', ['$scope', '$attrs', function($scope, $attrs) {
    var unregister;
    $scope.$watch($attrs.otFieldPresence, function(v) {
      var id = $scope.otFieldPresenceId = v.join('.');
      var fp = 'presence.fields["' + id + '"]';
      if (unregister) unregister();
      unregister = $scope.$watch(fp, 'fieldPresence=' + fp);
    }, true);
  }]);
