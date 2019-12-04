import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  Notification,
  Modal,
  Button,
  Paragraph,
  Typography
} from '@contentful/forma-36-react-components';
import { getModule } from 'NgRegistry';
import * as Authentication from 'Authentication';
import * as TokenStore from 'services/TokenStore';
import * as Analytics from 'analytics/Analytics';
import * as UrlSyncHelper from 'account/UrlSyncHelper';
import * as createSpace from 'services/CreateSpace';
import * as ModalLauncher from 'app/common/ModalLauncher';
import { go } from 'states/Navigator';

export default function handleGatekeeperMessage(data) {
  const $rootScope = getModule('$rootScope');
  const $location = getModule('$location');

  const match = makeMessageMatcher(data);

  if (match('create', 'UserCancellation')) {
    Authentication.cancelUser();
  } else if (match('new', 'space')) {
    createSpace.showDialog(data.organizationId);
  } else if (match('delete', 'space')) {
    TokenStore.refresh();
  } else if (data.type === 'analytics') {
    trackGKEvent(data);
  } else if (data.type === 'flash') {
    showNotification(data);
  } else if (match('navigate', 'location')) {
    $rootScope.$apply(() => $location.url(data.path));
  } else if (match('update', 'location')) {
    UrlSyncHelper.updateWebappUrl(data.path);
  } else if (matchesError(data, 401)) {
    Authentication.redirectToLogin();
  } else if (matchesError(data)) {
    showErrorModal(data);
  } else {
    TokenStore.refresh();
  }
}

function matchesError(data, errorCode) {
  if (data.type !== 'error') {
    return false;
  }

  if (errorCode) {
    return data.status === errorCode;
  } else {
    return /^(4|5)[0-9]{2}$/.test(data.status);
  }
}

function makeMessageMatcher(data) {
  return function matchMessage(action, type) {
    const messageAction = _.get(data, 'action', '').toLowerCase();
    const messageType = _.get(data, 'type', '').toLowerCase();

    return action.toLowerCase() === messageAction && type.toLowerCase() === messageType;
  };
}

function ErrorModal({ isShown, onClose, title, message }) {
  return (
    <Modal
      title={title}
      isShown={isShown}
      onClose={onClose}
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEscapePress={false}>
      <Typography>
        <Paragraph>{message}</Paragraph>
      </Typography>
      <Button onClick={onClose} buttonType="muted">
        Okay, got it
      </Button>
    </Modal>
  );
}

ErrorModal.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired
};

function showErrorModal(data) {
  const defaultTitle = 'Something went wrong';
  const defaultMessage =
    'An error has occurred. We have been automatically notified and will investigate. If it re-occurs, please contact support.';

  const modalKey = Date.now();
  ModalLauncher.open(({ isShown, onClose }) => (
    <ErrorModal
      title={_.unescape(data.heading) || defaultTitle}
      message={_.unescape(data.body) || defaultMessage}
      isShown={isShown}
      onClose={onClose}
      key={modalKey}
    />
  )).then(() => go({ path: 'home' }));
}

function showNotification(data) {
  const level = _.get(data, 'resource.type', 'info');
  const message = _.get(data, 'resource.message');

  if (!level) {
    return;
  }

  if (message) {
    if (level.match(/error/)) {
      Notification.error(message, {
        id: 'gatekeeper-error'
      });
    } else {
      Notification.success(message);
    }
  }
}

function trackGKEvent({ event, data: eventData }) {
  const $state = getModule('$state');

  if (event && eventData) {
    const newData = Object.assign({}, eventData);

    if (newData.fromState === '$state.current.name') {
      newData.fromState = $state.current.name;
    }

    Analytics.track(event, newData);
  }
}
