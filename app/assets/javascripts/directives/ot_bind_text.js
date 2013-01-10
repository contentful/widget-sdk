define([
  'lodash'
], function(_){
  'use strict';

  return {
    //
    // Directive to bind a text-editing element directly to a shareJS
    // document with a certain path
    //
    name: 'otBindText',
    factory: function() {
      return {
        restrict: 'A',
        scope: {
          doc: '=',
          path: '=otBindText'
        },
        link: function(scope, elm) {

          scope.subDoc = null;
          scope.removeBinding = null;

          scope.$watch('path', function(path, old, scope) {
            if (scope.subDoc) {
              scope.ensureStringAtPath(function() {
                scope.removeBinding = scope.subDoc.attach_textarea(elm[0]);
              });
              var args = [0, scope.subDoc.path.length].concat(path);
              scope.subDoc.path.splice.apply(scope.subDoc.path, args);
            }
          });

          scope.$watch('doc', function(doc, old, scope) {
            if (old && old != doc) {
              scope.removeBinding();
              scope.removeBinding = null;
              scope.subDoc = null;
            }

            if (doc) {
              var initialPath = scope.path ? scope.path : [];
              scope.subDoc = doc.at(initialPath);
              if (scope.path) {
                scope.ensureStringAtPath(function() {
                  scope.removeBinding = scope.subDoc.attach_textarea(elm[0]);
                });
              }
            }
          });

          scope.$on('$destroy', function() {
            if (scope.removeBinding) {
              scope.removeBinding();
              scope.removeBinding = null;
            }
          });

          scope.ensureStringAtPath = function(callback) {
            if (!_.isString(this.doc.getAt(this.path))) {
              var cb = function() {
                this.$apply(callback);
              };
              this.mkpath('', cb);
            } else {
              callback();
            }
          };

          scope.mkpath = function(setValue, callback){
            var parts = this.path.concat();
            var doc = this.doc;
            var value, tmp;

            while(parts.length > 0) {
              doc = doc.at(parts.shift());
              if (!_.isPlainObject(doc.get())){
                value = setValue;
                while(parts.length > 0) {
                  tmp = {};
                  tmp[parts.pop()] = value;
                  value = tmp;
                }
                doc.set(value, callback);
                return;
              }
            }
          };


        }

      };
    }
  };

});

