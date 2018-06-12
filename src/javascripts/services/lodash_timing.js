'use strict';
angular.module('contentful').config(['$provide', $provide => {
  $provide.value('debounce', _.debounce);
  $provide.value('throttle', _.throttle);
  $provide.value('defer'   , _.defer   );
  $provide.value('delay'   , _.delay   );
}]);
