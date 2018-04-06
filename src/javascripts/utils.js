// 'use strict';

// /**
//  * @ngdoc module
//  * @name cf.utils
//  * @description
//  * Various utility services that are not UI specific
//  */
// angular.module('cf.utils')

// /**
//  * @ngdoc service
//  * @module cf.utils
//  * @name pluralize
//  * @description
//  * Return the plural of a word.
//  */
// .provider('pluralize', function () {
//   var irregular = {};

//   this.addIrregulars = function (dict) {
//     _.forEach(dict, function (plural, singular) {
//       irregular[singular.toLowerCase()] = plural.toLowerCase();
//     });
//   };

//   this.$get = ['stringUtils', function (stringUtils) {
//     return function pluralize (word) {
//       if (!word) {
//         return '';
//       }

//       var lower = word.toLowerCase();
//       var plural = irregular[lower] || lower + 's';
//       if (lower[0] !== word[0]) {
//         return stringUtils.capitalize(plural);
//       } else {
//         return plural;
//       }
//     };
//   }];
// }).config(['pluralizeProvider', function (pluralizeProvider) {
//   pluralizeProvider.addIrregulars({
//     'entry': 'entries'
//   });
// }]);
