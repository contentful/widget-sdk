angular.module('contentful').factory('TabList', function($rootScope, analytics, modalDialog){
  'use strict';

  function TabList() {
    this.items = [];
    this.current = null;
  }

  TabList.prototype = {
    activate: function(item){
      if (item === this.current) return;
      var event = $rootScope.$broadcast('tabWantsActive', item);
      if (!event.defaultPrevented){
        analytics.tabActivated(item, this.current);
        this.current = item;
        $rootScope.$broadcast('tabBecameActive', item);
      }
    },

    add: function(options){
      if (this._closingAll) return null;

      var item = this.makeItem(options);
      this.items.push(item);
      analytics.tabAdded(item);
      return item;
    },

    // TODO Unfortunate to not call closeTab or tab.close here, but
    // closeTab might leave the tab open. we need to force the tabs close
    closeAll: function(){
      this._closingAll = true;
      try {
        var items = this.items;
        //var current = this.current;
        this.items = [];
        this.current = null;
        _.each(items, function (tab) {
          $rootScope.$broadcast('tabWantsClose', tab);
          $rootScope.$broadcast('tabClosed'    , tab);
        });
      } finally {
        this._closingAll = false;
      }
    },

    makeItem: function(options){
      var item = new TabItem(options);
      item.list = this;
      return item;
    },

    askToCloseTab: function (tab) {
      var list = this;
      if (tab.dirty) {
        modalDialog.open({
          title: 'Close Tab?',
          message: tab.closingMessage,
          scope: $rootScope
        }).then(function () {
          list.closeTab(tab);
        });
      } else {
        this.closeTab(tab);
      }
    },

    closeTab: function (item) {
      var event = $rootScope.$broadcast('tabWantsClose', item);
      if (!event.defaultPrevented){
        var index = _.indexOf(this.items, item);
        var newCurrent = false;

        if (item.active()) {
          if (this.items.length == 1) {
            newCurrent = null;
          } else if (0 < index) {
            newCurrent = this.items[index-1];
          } else {
            newCurrent = this.items[index+1];
          }
        }

        this.items.splice(index,1);
        if (item.active()) {
          this.current = null;
        }
        $rootScope.$broadcast('tabClosed', item);
        analytics.tabClosed(item);
        if (newCurrent !== false && newCurrent !== null && this.current === null) {
          newCurrent.activate();
        }
      }
    },

    replaceTab: function(oldItem, newItem){
      var index = _.indexOf(this.items, oldItem);
      this.items.splice(index, 1, newItem);
      if (this.current == oldItem) this.activate(newItem);
    },

    currentViewType: function(){
      if (this.current){
        return this.current.viewType;
      }
    },

    currentParams: function(){
      if (this.current){
        return this.current.params;
      }
    },

    currentSection: function(){
      if (this.current){
        return this.current.section;
      }
    },

    numVisible: function () {
      return _.foldl(this.items, function (sum, tab) {
        return sum + (tab.hidden ? 0 : 1);
      }, 0);
    },

  };

  function TabItem(options) {
    if (options === undefined) options = {};
    this.section  = options.section;
    this.viewType = options.viewType;
    this.params   = options.params;
    this.title    = options.title;
    this.hidden   = options.hidden;
    if (options.canClose !== undefined) {
      this._canClose = options.canClose;
    } else {
      this._canClose = true;
    }
  }

  TabItem.prototype = {
    activate: function () {
      this.list.activate(this);
    },

    active: function(){
      return this.list.current == this;
    },

    title: function(){
      return this.title;
    },

    close: function() {
      this.list.askToCloseTab(this);
    },

    canClose: function(){
      return this._canClose;
    },

    replace: function(options){
     var item = this.list.makeItem(options);
     this.list.replaceTab(this, item);
     return item;
    }

  };

  return TabList;

});
