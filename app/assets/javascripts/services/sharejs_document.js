define([
  'services',
  'sharejs'
], function(services, sharejs){
  'use strict';
  
  var url = document.location.protocol + '//' + document.location.hostname + ':8000/channel';
  var connection;

  function toKey(sys) {
     var type = (sys.type === 'archivedEntry') ? 'entry' : sys.type;
     var parts = [type, sys.id];
     if (sys.bucket) parts.unshift('bucket', sys.bucket);
     return parts.join(':');
  }

  function SharejsDocument(doc, path) {
    this.doc = doc;
    if (path) {
      this.path = path;
    } else {
      this.path = [];
    }
    //doc.on('change', function (x) {
      //console.log('change', x)
    //})
  }

  SharejsDocument.open = function(entry, callback) {
    var key = toKey(entry.data.sys);
    connection.open(key, 'json', function(err, doc){
      if (!err) {
        if (doc.state === 'closed') {
          doc.open(function (error) {
            if (!error) {
              callback(null, new SharejsDocument(doc));
            } else {
              callback(new SharejsDocument(doc));
            }
          });
        } else {
          callback(null, new SharejsDocument(doc));
        }
      } else {
        setTimeout(function(){callback(err);},1);
      }
    });
  };

  SharejsDocument.prototype = {
    close: function(callback){
      var synchronous = true;
      this.doc.close(function(){
        console.log('Doc close', synchronous);
        if (synchronous) {
          setTimeout(callback,1);
        } else {
          callback();
        }
      });
      synchronous = false;
    },

    subdoc: function(path) {
      return new SharejsDocument(this.doc, this.path.concat(path));
    },

    attachToTextInput: function (elem) {
      this.doc.at(this.path).attach_textarea(elem);
    },

    parentPath: function(){
      return this.path.slice(0,-1);
    },

    parent: function() {
      return new SharejsDocument(this.doc, this.parentPath());
    },

    pathLast: function () {
      return this.path[this.path.length-1];
    },

    value: function() {
      return this.doc.getAt(this.path);
    },

    set: function (val, callback) {
      this.doc.at(this.path).set(val, callback);
    },
    
    onReplace: function(callback) {
      var self = this;
      var parent = this.doc.at(this.parentPath());
      var listener = parent.on('replace', function(position, was, now){
        console.log('received replace at', position, was, now);
        if (position === self.pathLast()) {
          callback(was, now);
        }
      });
      
      return function unsubscribeOnReplaceListener(){
        parent.removeListener(listener);
      };
      
    }


  };

  function SharejsDocumentProvider() {
    this.url = function(e) {
      url = e;
    };

    this.$get = function() {
      connection = new sharejs.Connection(url);
      return SharejsDocument;
    };
  }

  return services.provider('SharejsDocument', SharejsDocumentProvider);
});
