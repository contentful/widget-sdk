'use strict';

beforeEach(function() {
  this.addMatchers({
    toBePlaying: function(expectedSong) {
      var player = this.actual;
      return player.currentlyPlayingSong === expectedSong && player.isPlaying;
    },

    toLookEqual: function (other) {
      return angular.equals(this.actual, other);
    }
  });
});

window.scope = function(elem) {
  return angular.element(elem).scope();
};
