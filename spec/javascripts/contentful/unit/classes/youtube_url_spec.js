'use strict';

describe('YoutubeUrl', function() {
  var youtubeUrl, YoutubeUrl;

  beforeEach(function() {
    module('contentful/test');
    inject(function($injector){
      YoutubeUrl = $injector.get('YoutubeUrl');
    });
  });

  afterEach(inject(function($log){
    $log.assertEmpty();
  }));

  describe('#isValid', function() {
    function testIsValidYoutubeUrl(url) {
      it('returns true if the base wrapped url is a valid Youtube URL', function(){
        youtubeUrl = new YoutubeUrl(url);
        expect(youtubeUrl.isValid()).toBeTruthy();
      });
    }

    function testIsInvalidYoutubeUrl(url) {
      it('returns false if the base wrapped url is a valid Youtube URL', function(){
        youtubeUrl = new YoutubeUrl(url);
        expect(youtubeUrl.isValid()).toBeFalsy();
      });
    }

    testIsValidYoutubeUrl('https://www.youtube.com/watch?v=7-RRVdEhm_o');
    testIsValidYoutubeUrl('http://youtube.com/v/voceyAq-R9E');
    testIsValidYoutubeUrl('http://youtu.be/zc0s358b3Ys');
    testIsValidYoutubeUrl('http://www.youtube.com/embed/zc0s358b3Ys');
    testIsValidYoutubeUrl('http://www.youtube.com/v/-wtIMTCHWuI?version=3&autohide=1');

    testIsInvalidYoutubeUrl('http://youtube.com/voceyAq-R9E'); //missing /v/ in path
    testIsInvalidYoutubeUrl('https://www.youtube.com/watch?v=7-RRVdEh'); //not 11 chars on ID
    testIsInvalidYoutubeUrl('https://www.youtube.com/?v=7-RRVdEh'); //missing 'watch' in path
    testIsInvalidYoutubeUrl('http://youtu.be/v/zc0s358b3Ys'); //unexpected '/v/' in path
    testIsInvalidYoutubeUrl('http://www.youtube.com/embed2/zc0s358b3Ys'); //typo in 'embed'
  });
});
