'use strict';

angular.module('cf.utils')
.factory('moment', ['raw/moment', moment => {
  moment.locale('en', {
    calendar: {
      lastDay : '[Yesterday], LT',
      sameDay : '[Today], LT',
      nextDay : '[Tomorrow], LT',
      lastWeek : 'ddd, LT',
      nextWeek : '[Next] ddd, LT',
      sameElse : 'll'
    }
  });

  return moment;
}]);
