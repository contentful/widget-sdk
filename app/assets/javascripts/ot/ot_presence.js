'use strict';

angular.module('contentful').

  value('otPresenceConfig', {
    focusThrottle: 10e3,
    pingTimeout: 60e3
  }).

  directive('otDocPresence', function() {
    return {
      require: '^otDocFor',
      controller: OtDocPresenceCtrl
    };
  }).

  directive('otFieldPresence', function() {
    return {
      require: '^otDocPresence',
      link: function(scope, element, attrs, otPresenceCtrl) {
        function focus() {
          if (!scope.otFieldPresenceId) return;
          otPresenceCtrl.focus(scope.otFieldPresenceId);
        }

        element.find('input, textarea').on('focus keydown', focus);
      },

      controller: function($scope, $attrs) {
        var unregister;
        $scope.$watch($attrs.otFieldPresence, function(v) {
          var id = $scope.otFieldPresenceId = v.join('.');
          var fp = 'presence.fields["' + id + '"]';
          if (unregister) unregister();
          unregister = $scope.$watch(fp, 'fieldPresence=' + fp);
        }, true);
      }
    };
  });

function OtDocPresenceCtrl($scope, $timeout, otPresenceConfig) {
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

  function closedHandler() {
    $scope.otDoc.shout(['close', user]);
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
    doc.on('closed', closedHandler);
    doc.on('shout', shoutHandler);
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

  $scope.$on('$destroy', function(event) {
    var scope = event.currentScope;
    $timeout.cancel(timeout);
    if (scope.otDoc) {
      scope.otDoc.removeListener('closed', closedHandler);
      scope.otDoc.removeListener('shout', shoutHandler);
    }

  });
}

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
  return {sys: {type: 'link', linkType: 'user', id: id}};
}
