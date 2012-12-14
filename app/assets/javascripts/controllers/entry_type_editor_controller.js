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


    $scope.exitEditor = function(){
      $scope.doc.close(function(){
        $scope.$apply(function(scope){
          scope.tab.close();
        });
      });
    };

    $scope.entryTypePersisted = function() {
      return !!this.entryType.getId();
    };

    //$scope.$on('inputBlurred', function(event) {
      //event.stopPropagation();
      //event.currentScope.updateFromShareJSDoc();
    //});

    $scope.updateFromShareJSDoc = function() {
      this.entryType.update(this.doc.value());
    };

    $scope.headline = function(){
      var verb = $scope.tab.params.mode == 'edit' ? 'Editing' : 'Creating';
      return verb + ' Content Type';
    };

  });
});

