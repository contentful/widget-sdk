import { registerFactory } from 'NgRegistry.es6';
import { drop } from 'lodash';
import debounce from 'lodash/debounce';

export default function register() {
  registerFactory('PromisedLoader', [
    '$q',
    $q => {
      function PromisedLoader() {
        this.inProgress = false;
        this._loadPromise = debounce(this._loadPromiseImmediately, 500, { leading: true });
      }

      PromisedLoader.IN_PROGRESS = 'Already in progress';

      PromisedLoader.prototype = {
        startLoading: function() {
          this.inProgress = true;
        },

        endLoading: function() {
          this.inProgress = false;
        },

        _loadPromiseImmediately: function(promiseLoader, args, deferred) {
          const loader = this;
          this.startLoading();
          promiseLoader(...args).then(
            res => {
              deferred.resolve(res);
              loader.endLoading();
            },
            err => {
              deferred.reject(err);
              loader.endLoading();
            }
          );
        },

        _loadPromise: null, // Initialized in Constructor

        loadPromise: function(promiseLoader /*, args[] */) {
          const deferred = $q.defer();
          const args = drop(arguments, 1);
          if (this.inProgress) {
            deferred.reject(PromisedLoader.IN_PROGRESS);
            return deferred.promise;
          }

          this._loadPromise(promiseLoader, args, deferred);

          return deferred.promise;
        }
      };

      return PromisedLoader;
    }
  ]);
}
