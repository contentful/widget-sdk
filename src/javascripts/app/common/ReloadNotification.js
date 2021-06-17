import React from 'react';
import PropTypes from 'prop-types';
import { isObject } from 'lodash';
import qs from 'qs';
import { Modal, Button } from '@contentful/forma-36-react-components';
import { ModalLauncher } from '@contentful/forma-36-react-components';
import * as auth from 'Authentication';

let open = false;

const ReloadNotificationDialog = ({ isShown, onReload, title, message, children }) => (
  <Modal
    isShown={isShown}
    onClose={onReload}
    shouldCloseOnEscapePress={false}
    shouldCloseOnOverlayClick={false}>
    {() => (
      <React.Fragment>
        <Modal.Header title={title} />
        <Modal.Content>
          {message && <p>{message}</p>}
          {children}
        </Modal.Content>
        <Modal.Controls>
          <Button buttonType="positive" onClick={onReload}>
            Reload application
          </Button>
        </Modal.Controls>
      </React.Fragment>
    )}
  </Modal>
);

ReloadNotificationDialog.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onReload: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  children: PropTypes.node,
};

const ApiErrorMessage = () => (
  <p>
    If this problem persists after reloading, please check{' '}
    <a href="https://www.contentfulstatus.com/" target="_blank" rel="noopener noreferrer">
      our status page
    </a>{' '}
    for incidents.
  </p>
);

function reloadWithCacheBuster() {
  const search = qs.parse(window.location.search.replace(/^\?/, ''));
  let path = window.location.pathname;
  const reloaded = search.reloaded;
  search.cfv = Math.ceil(Math.random() * 10000000);
  if (reloaded) {
    delete search.reloaded;
    path = '/';
  } else {
    search.reloaded = true;
  }
  window.location = `${path}?${qs.stringify(search)}`;
}

function reloadWithLogout() {
  auth.logout();
}

const trigger = async (options = {}) => {
  if (open) {
    return;
  }
  open = true;
  await ModalLauncher.open(() => (
    <ReloadNotificationDialog
      title={options.title || 'The application needs to reload'}
      message={options.message || 'The application has encountered a problem and needs to reload.'}
      isShown
      onReload={() => {
        reloadWithCacheBuster();
      }}>
      {options.children || null}
    </ReloadNotificationDialog>
  ));
};

const triggerAndLogout = async (options = {}) => {
  if (open) {
    return;
  }
  open = true;
  await ModalLauncher.open(() => (
    <ReloadNotificationDialog
      title={'The session expired'}
      message={options.message}
      isShown
      onReload={() => {
        reloadWithLogout();
      }}>
      {options.children || null}
    </ReloadNotificationDialog>
  ));
};

function isApiError(error) {
  return (
    isObject(error) && 'statusCode' in error && error.statusCode >= 500 && error.statusCode !== 502
  ); // 502 means a space is hibernated
}

export default {
  triggerImmediateReload: function () {
    reloadWithCacheBuster();
  },

  trigger: function (message, title) {
    trigger({ message: message, title: title });
  },

  triggerAndLogout: function (message, title) {
    triggerAndLogout({ message: message, title: title });
  },

  gatekeeperErrorHandler: function (err) {
    if (isApiError(err)) {
      trigger({
        title: 'Error connecting to authentication server',
        message: 'There was an error trying to retrieve login information.',
        children: <ApiErrorMessage />,
      });
    }
    return Promise.reject(...arguments);
  },
  apiErrorHandler: function (err) {
    if (isApiError(err)) {
      trigger({
        title: 'Error connecting to backend',
        message: 'There was a problem connecting to the Content Management API.',
        children: <ApiErrorMessage />,
      });
    }
    return Promise.reject(...arguments);
  },
  basicErrorHandler: function () {
    trigger();
  },
};
