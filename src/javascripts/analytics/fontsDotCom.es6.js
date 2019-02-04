import { registerFactory } from 'NgRegistry.es6';

export default function register() {
  /**
   * @ngdoc service
   * @name fontsDotCom
   * @description
   * This service is a simple wrapper for loading
   * a tracking CSS file served by fonts.com.
   *
   * We host files on our own, but the fonts.com
   * EULA states that we should also load the CSS
   * on all the pages where we use them.
   *
   * We violate the EULA slightly by not calling
   * `enable` for users that didn't agree with
   * our analytics policy. I think they don't
   * care that much :)
   */
  registerFactory('fontsDotCom', [
    'LazyLoader',
    LazyLoader => ({
      enable: function() {
        LazyLoader.get('fontsDotCom');
      }
    })
  ]);
}
