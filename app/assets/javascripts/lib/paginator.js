define([
  'lodash'
], function(_) {
  'use strict';

  function Paginator(numEntries) {
    this.numEntries = numEntries || 0;
    this.page = 0;
    this.pageLength = 20;
  };

  Paginator.prototype = {
    startIndex: function() {
      return this.page * this.pageLength
    },

    endIndex: function() {
      return (this.page+1) * this.pageLength
    },

    numPages: function() {
      return Math.ceil(this.numEntries / this.pageLength);
    },

    slice: function(array) {
      return array.slice(this.startIndex(), this.endIndex());
    },

    atFirst: function() {
      return this.page == 0;
    },

    atLast: function() {
      return this.page == this.numPages()-1
    },

    pages: function() {
      // var pages = [];
      // for (var i=0, l=this.numPages(); i < l)
      return _.range(this.numPages());
    },

    goTo: function(page){
      this.page = page;
    },

    goNext: function(){
      if (!this.atLast()) this.page++;
    },

    goPRev: function(){
      if (!this.atFirst()) this.page--;
    }
  };

  return Paginator;
})