import React, { useState, useEffect } from 'react';
import { Spinner } from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { getModule } from 'NgRegistry';
import { flow } from 'lodash';

const styles = {
  spinner: css({
    display: 'block'
  }),
  spinnerText: css({
    marginLeft: tokens.spacingS,
    fontSize: tokens.fontSize2Xl
  })
};

const Loader = function({ isShown, message, watchStateChange, testId }) {
  const [isOpen, setLoaderIsOpen] = useState(isShown);

  const loaderMessage = ['undefined', 'null'].includes(message) ? 'Please hold on...' : message;

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
          set: function(value) {
            (value ? showLoader : hideLoader)();
            notify = value;
          },
          get: function() {
            return notify;
          }
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

  const messageTestId = `${testId}-message`;

  return isOpen ? (
    <div
      className="loader"
      role="progressbar"
      aria-busy={isOpen}
      aria-label="loader-interstitial"
      data-test-id={testId}>
      <div className="loader__container">
        <Spinner size="large" className={styles.spinner} />
        <div className={styles.spinnerText} data-test-id={messageTestId}>
          {loaderMessage}
        </div>
      </div>
    </div>
  ) : null;
};

Loader.propTypes = {
  isShown: PropTypes.bool,
  message: PropTypes.string,
  watchStateChange: PropTypes.bool,
  testId: PropTypes.string
};

Loader.defaultProps = {
  isShown: false,
  message: 'Please hold on...',
  watchStateChange: false,
  testId: 'loading-indicator'
};

export default Loader;
