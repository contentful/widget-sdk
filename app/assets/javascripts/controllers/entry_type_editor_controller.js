define([
  'controllers',
  'lodash',

  'services/sharejs',
  'controllers/bucket_controller'
], function(controllers, _){
  'use strict';

  return controllers.controller('EntryTypeEditorCtrl', function($scope, ShareJS) {
    $scope.availableTypes = [
      {name: 'Text'          , value: 'text'    },
      {name: 'Symbol'        , value: 'string'  },
      {name: 'Integer'       , value: 'integer' },
      {name: 'Floating-point', value: 'number'  },
      {name: 'Yes/No'        , value: 'boolean' },
      {name: 'List'          , value: 'array'   },
      {name: 'Date/Time'     , value: 'date'    },
      {name: 'Object'        , value: 'object'  },
      {name: 'Location'      , value: 'location'},
    ];

    $scope.$watch('tab.params.entryType', 'entryType=tab.params.entryType');

    $scope.$watch('entryType', function(entryType, old, scope){
      if (!entryType) return;
      if (scope.shareJSstarted) {
        console.log('Fatal error, shareJS started twice');
      }

      loadPublishedEntryType();

      ShareJS.open(entryType, function(err, doc) {
        if (!err) {
          scope.$apply(function(scope){
            scope.doc = doc;
            scope.remoteOpListener = scope.doc.on('remoteop', function(op) {
              scope.$apply(function(scope) {
                scope.updateFromShareJSDoc();
                // TODO Also update the publishedEntryType if a publishing action was received
                // or there have been local changes
              });
            });
          });
        } else {
          console.log('Error opening connection', err);
        }
      });
      scope.shareJSstarted = true;
    });

    $scope.namePath = ['name'];

    function loadPublishedEntryType() {
      $scope.entryType.getPublishedVersion(function(err, publishedEntryType) {
        $scope.$apply(function(scope) {
          scope.publishedEntryType = publishedEntryType;
        });
      });
    }

    $scope.$watch('entryType.data.fields', function(fields, old, scope) {
      var availableFields = _(fields).filter(function(field) {
        return field.type === 'text' || field.type === 'string';
      }).sortBy('name').valueOf();

      if (!_.isEqual(scope.availableDisplayNameFields, availableFields)) {
        scope.availableDisplayNameFields = availableFields;
        console.log('setting availablefields to %o  from %o ', availableFields, fields);
      }
    });

    $scope.displayNameChanged = function() {
      console.log('display Name changed', this.entryType.data.displayName);
      var scope = this;
      this.doc.setAt(['displayName'], this.entryType.data.displayName, function(err) {
        scope.$apply(function(scope) {
          if (err) {
            scope.entryType.data.displayName = scope.doc.snapshot.displayName;
          }
        });
      });
    };

    $scope.canPublish = function() {
      if (!$scope.doc) return false;
      return true;
    };

    $scope.publishedAt = function(){
      if (!$scope.doc) return;
      var val = $scope.doc.getAt(['sys', 'publishedAt']);
      if (val) {
        return new Date(val);
      } else {
        return undefined;
      }
    };

    $scope.publishedVersion = function() {
      if (!$scope.doc) return;
      return $scope.doc.getAt(['sys', 'publishedVersion']);
    };

    $scope.publish = function() {
      var version = $scope.doc.version;
      $scope.entryType.publish(version, function (err, publishedEntryType) {
        $scope.$apply(function(scope){
          if (err) {
            window.alert('could not publish');
          } else {
            scope.publishedEntryType = publishedEntryType;
          }
        });
        $scope.$broadcast('published');
        $scope.bucketContext.refreshEntryTypes($scope);
      });
    };

    $scope.$on('$destroy', function(event) {
      var scope = event.currentScope;
      if (scope.remoteOpListener) {
        scope.doc.removeListener(scope.remoteOpListener);
        scope.remoteOpListener = null;
      }
      if (scope.tab.params.mode === 'create') {
        scope.bucketContext.refreshEntryTypes(scope);
      }
    });

    $scope.updateFromShareJSDoc = function() {
      var data = this.doc.snapshot;
      this.entryType.update(data);
    };

    $scope.headline = function(){
      var verb = $scope.tab.params.mode == 'edit' ? 'Editing' : 'Creating';
      return verb + ' Content Type';
    };

  });
});

