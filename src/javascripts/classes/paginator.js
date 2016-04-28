'use strict';
angular.module('contentful').factory('Paginator', function(){

  // @todo rename numEntries to numEntities
  // @todo revise API
  // @todo do not expose private state
  function Paginator(numEntries) {
    this.numEntries = numEntries || 0;
    this.page = 0;
    this.pageLength = 40;
  }

  Paginator.prototype = {
    skipItems: function() {
      return (this.page) * this.pageLength;
    },

    numPages: function() {
      return Math.ceil(this.numEntries / this.pageLength);
    },

    atFirst: function() {
      return this.page === 0;
    },

    atLast: function() {
      return this.page >= this.numPages()-1;
    }
  };

  return Paginator;
});
