import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'core/NgRegistry';
import { flow } from 'lodash';

import { LoadingState } from 'features/loading-state';

const Loader = function ({ isShown, watchStateChange, testId }) {
  const [isOpen, setLoaderIsOpen] = useState(isShown);

  useEffect(() => {
    let unsubscribe;

    if (watchStateChange) {
      const hideLoader = () => setLoaderIsOpen(false);
      const showLoader = (_event, _toState, _toParams, _fromState, _fromParams, options) => {
        // ensure that when options.notify is set anywhere else, it triggers re-render of this component
        // and hides / shows it automatically
        // TODO: Rewrite and use withRouter() (or similar) once we move to react routing
        let notify = options.notify;
        Object.defineProperty(options, 'notify', {
          configurable: true,
          enumerable: true,
          set: function (value) {
            (value ? showLoader : hideLoader)();
            notify = value;
          },
          get: function () {
            return notify;
          },
        });
        setLoaderIsOpen(notify);
      };

      const $rootScope = getModule('$rootScope');

      unsubscribe = $rootScope.$on(
        '$destroy',
        flow(
          $rootScope.$on('$stateChangeStart', showLoader),
          $rootScope.$on('$stateChangeSuccess', hideLoader),
          $rootScope.$on('$stateChangeCancel', hideLoader),
          $rootScope.$on('$stateNotFound', hideLoader),
          $rootScope.$on('$stateChangeError', hideLoader)
        )
      );
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [watchStateChange]);

  return isOpen ? (
    <div
      className="loader"
      role="progressbar"
      aria-busy={isOpen}
      aria-label="loader-interstitial"
      data-test-id={testId}>
      <LoadingState />
    </div>
  ) : null;
};

Loader.propTypes = {
  isShown: PropTypes.bool,
  watchStateChange: PropTypes.bool,
  testId: PropTypes.string,
};

Loader.defaultProps = {
  isShown: false,
  watchStateChange: false,
  testId: 'loading-indicator',
};

export default Loader;
