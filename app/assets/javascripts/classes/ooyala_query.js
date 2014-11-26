'use strict';

function Limit(value){
  this.value = value;
}

Limit.prototype.toQueryStringElement = function(){
  return 'limit=' + this.value;
};

function Where(property, value){
  this.property = property;
  this.value    = value;
}

Where.prototype.toQueryStringElement = function(){
  return 'where=' + escape(this.property + '=' + "'" + this.value + "'");
};

angular.module('contentful').factory('OoyalaQuery', function(){
  function OoyalaQuery() {
    this.parameters = [];
  }

  OoyalaQuery.prototype = {
    parameter: function(name, value){
      this.parameters.push(this._buildParameter(name, value));
      return this;
    },

    toQueryString: function() {
      return _.invoke(this.parameters, 'toQueryStringElement').join('&');
    },

    _buildParameter: function(name, value) {
       switch (name) {
         case 'limit'       : return new Limit(value);
         case 'name'        :
         case 'description' : return new Where(name, value);
       }
    }
  };

  return OoyalaQuery;
});
