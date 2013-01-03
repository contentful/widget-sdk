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
    ]; //TODO, later get this list from the validation.types object

    $scope.$watch('tab.params.entryType', 'entryType=tab.params.entryType');

    $scope.$watch('entryType', function(entryType, old, scope){
      if (!entryType) return;
      if (scope.shareJSstarted) {
        console.log('Fatal error, shareJS started twice');
      }

      loadPublishedEntryType();

      // TODO: This will currently fail horribly if the entryType is replaced because everything is still bound
      // to the old entryType
      ShareJS.open(entryType, function(err, doc) {
        if (!err) {
          scope.$apply(function(scope){
            scope.doc = doc;
          });
        } else {
          console.log('Error opening connection', err);
        }
      });
      scope.shareJSstarted = true;
    });

    // TODO right now we're not notified if another client publishes the entryType

    function loadPublishedEntryType() {
      $scope.entryType.getPublishedVersion(function(err, publishedEntryType) {
        $scope.$apply(function(scope) {
          scope.publishedEntryType = publishedEntryType;
        });
      });
    }

    $scope.exitEditor = function(){
      $scope.doc.close(function(){
        $scope.$apply(function(scope){
          scope.tab.close();
        });
      });
    };
    
    $scope.canPublish = function() {
      if (!$scope.doc) return false;
      return true;
    };

    $scope.publishedAt = function(){
      if (!$scope.doc) return;
      var val = $scope.doc.subdoc(['sys', 'publishedAt']).peek();
      if (val) {
        return new Date(val);
      } else {
        return undefined;
      }
    };

    $scope.publishedVersion = function() {
      if (!$scope.doc) return;
      return $scope.doc.subdoc(['sys', 'publishedVersion']).peek();
    };

    $scope.publish = function() {
      var version = $scope.doc.version();
      $scope.entryType.publish(version, function (err, publishedEntryType) {
        $scope.$apply(function(scope){
          if (err) {
            window.alert('could not publish');
          } else {
            scope.publishedEntryType = publishedEntryType;
            scope.updateFromShareJSDoc();
          }
        });
        $scope.$broadcast('published');
      });
    };

    //$scope.$on('inputBlurred', function(event) {
      //event.stopPropagation();
      //event.currentScope.updateFromShareJSDoc();
    //});

    $scope.updateFromShareJSDoc = function() {
      var data = this.doc.value();
      this.entryType.update(data);
    };

    $scope.headline = function(){
      var verb = $scope.tab.params.mode == 'edit' ? 'Editing' : 'Creating';
      return verb + ' Content Type';
    };

  });
});

