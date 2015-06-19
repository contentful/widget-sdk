'use strict';

// FIXME Somehow we need to add the matchers before every test case. If
// we add them once globally they are removed later and the tests fail.
beforeEach(function () {
  jasmine.addMatchers({

    toLookEqual: function() {
      return {
        compare: function (actual, expected) {
          return {
            pass: angular.equals(actual, expected),
            message: 'Expected ' + JSON.stringify(actual) + ' to look equal to ' + JSON.stringify(expected)
          };
        }
      };
    },

    toHaveClass: function () {
      return {
        compare: function (actual, expected) {
          var pass = actual.hasClass(expected);
          var notText = pass ? 'not ' : '';
          return {
            pass: pass,
            message: 'Expected element ' + notText + 'to have class '+expected
          };
        }
      };
    },

    toBeNgHidden: function () {
      return {
        compare: function (actual) {
          var pass = actual.hasClass('ng-hide');
          var notText = pass ? 'not ' : '';
          return {
            pass: pass,
            message: 'Expected element ' + notText + 'to be ng-hidden'
          };
        }
      };
    },

    toHaveTagName: function () {
      return {
        compare: function (actual, expected) {
          var pass, tag;
          if(actual.tagName){
            tag = actual.tagName.toLowerCase();
          } else if(actual.get && actual.get(0) && actual.get(0).tagName){
            tag = actual.get(0).tagName.toLowerCase();
          }
          pass = tag && tag === expected;
          var notText = pass ? 'not ' : '';
          return {
            pass: pass,
            message: 'Expected element with tag '+tag+' '+notText+'to have tag name '+expected
          };
        }
      };
    },

    toBeInstanceOf: function() {
      return {
        compare: function(actual, expected) {
          var pass, notText;

          pass    = (actual instanceof expected);
          notText = pass ? ' not' : '';

          return {
            pass    : pass,
            message : 'Expected ' + actual.constructor.name + notText + ' to be an instance of ' + expected.name
          };
        }
      };
    },

    toEqualObj: function () {
      var KINDS = {
        'N': 'newly added property/element',
        'D': 'property/element was deleted',
        'E': 'property/element was edited',
        'A': 'change occurred within an array'
      };

      function formatDiff(objdiff) {
        return objdiff.map(function (diff) {
          return '\t'+diff.kind +' at '+ diff.path.join('.') +'\n'+
            '\t'+diff.actual +' should be '+ diff.expected;
        }).join('\n\n');
      }

      return {
        compare: function (actual, expected) {
          /* global deepDiff */
          var objdiff = (deepDiff(expected, actual) || []).map(function (diff) {
            return {
              kind: KINDS[diff.kind],
              path: diff.path,
              expected: diff.lhs,
              actual: diff.rhs
            };
          });

          //console.log(actual, expected, objdiff);
          return {
            pass    : objdiff.length === 0,
            message : 'Expected object not to have differences\n\n' + formatDiff(objdiff)
          };

        }
      };
    }
  });
});
