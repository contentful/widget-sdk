'use strict';

function TabList(scope) {
  this.scope = scope;
  this.items = [];
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
    item.list = this;
    return item;
  },

  closeTab: function (item) {
     var event = this.scope.$broadcast('tabWantsClose', item);
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
       this.scope.$broadcast('tabClosed', item);
       if (newCurrent !== false && newCurrent !== null) {
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

};

function TabItem(options) {
  if (options === undefined) options = {};
  this.section  = options.section;
  this.viewType = options.viewType;
  this.params   = options.params;
  this.title    = options.title;
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
    this.list.closeTab(this);
  },

  closeAsync: function(){
    // This is a workaround for a strange behavior when adding ngClick
    // directives on nested elements (namely the close buttons in the
    // tab)
    var self = this;
    setTimeout(function(){
      self.list.scope.$apply(function() {
        self.close();
      });
    }, 1);
  },

  canClose: function(){
    return this.list.items.length > 1 && this._canClose;
  },

  replace: function(options){
   var item = this.list.makeItem(options);
   this.list.replaceTab(this, item);
   return item;
  }
};
