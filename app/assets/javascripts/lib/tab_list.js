define([
  'lodash'
], function(_){
  'use strict';

  function TabList(scope) {
    this.scope = scope;
    this.items = [];
    this.button = null;
    this.current = null;
  }

  TabList.prototype = {
    activate: function(item){
      var event = this.scope.$broadcast('tabWantsActive', item);
      if (!event.defaultPrevented){
        this.current = item;
        this.scope.$broadcast('tabBecameActive', item);
      }
    },

    clickButton: function(value){
      if (this.hasButton() && this.currentButton().active) {
        this.scope.$broadcast('tabButtonClicked', this.currentButton(), value);
      }
    },

    buttonActive: function(newState){
      if (this.hasButton()){
        if (newState !== undefined) {
          this.currentButton().active = newState;
        }
        return this.currentButton().active;
      }
    },

    buttonHasOptions: function() {
      return this.hasButton() && !!this.currentButton().options;
    },

    currentButton: function() {
      return this.current && this.current.options.button;
    },

    hasButton: function(){
      return this.currentButton();
    },

    add: function(options){
      var item = this.makeItem(options);
      this.items.push(item);
      return item;
    },

    closeAll: function(){
      this.items = [];
      this.current = null;
    },

    makeItem: function(options){
      var item = new TabItem(options);
      item._list = this;
      return item;
    },

    //setButton: function(title, callback){
    //  this.button = {title: title, callback: callback};
    //},

    //clearButton: function () {
    //  this.button = null;
    //},

   closeTab: function (item) {
     var index = _(this.items).indexOf(item);
     if (this.current == item) this.current = null;
     this.items.splice(index,1);
   },

   replaceTab: function(oldItem, newItem){
     var index = _(this.items).indexOf(oldItem);
     this.items.splice(index, 1, newItem);
     if (this.current == oldItem) this.activate(newItem);
   },

   currentViewType: function(){
     if (this.current){
       return this.current.options.viewType;
     }
   },

   currentParams: function(){
     if (this.current){
       return this.current.options.params;
     }
   }

  };

  function TabItem(options) {
    if (options === undefined) options = {};
    this.options = options;
  }

  TabItem.prototype = {
    activate: function () {
      this._list.activate(this);
    },

    active: function(){
      return this._list.current == this;
    },

    title: function(){
      return this.options.title;
    },

    close: function() {
      this._list.removeItem(this);
    },

    replace: function(options){
     var item = this._list.makeItem(options);
     this._list.replaceTab(this, item);
     return item;
    }
  };
  return TabList;
});
