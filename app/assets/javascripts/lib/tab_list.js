define([
  'lodash'
], function(_){
  function TabList() {
    this.items = [];
    this.button = null;
  }

  TabList.prototype = {
    add: function(title, options){
      var item = this.makeItem(title, options);
      this.items.push(item);
      return item;
    },

    getActive: function () {
      return _(this.items).find(function(item){
        return item.active === true;
      });
    },

    makeItem: function(title, options){
      var item = new TabItem(title, options);
      item._list = this;
      return item;
    },

    setButton: function(title, callback){
      this.button = {title: title, callback: callback};
    },

    clearButton: function () {
      this.button = null;
    },

    deactivateAll: function(){
      for (var i = 0; i < this.items.length; i += 1) {
        this.items[i].active = false;
      }
    },

   removeItem: function (item) {
     var index = _(this.items).indexOf(item);
     this.items.splice(index,1);
   },

   replaceItem: function(oldItem, newItem){
     var index = _(this.items).indexOf(oldItem);
     this.items.splice(index, 1, newItem);
   }

  };

  function TabItem(title, options) {
    if (options === undefined) options = {};
    this.title = title;
    this.options = options;
    this.active = false;
  }

  TabItem.prototype = {
    activate: function (run) {
      if (run === undefined) {
        run = true;
      }
      if (run && typeof this.options.activate === 'function'){
        this.options.activate();
      }
      this._list.deactivateAll();
      this.active = true;
    },

    remove: function() {
      this._list.removeItem(this);
    },

    replace: function(title, options){
     var item = this._list.makeItem(title, options);
     this._list.replaceItem(this, item);
     return item;
    }
  };
  return TabList;
});
