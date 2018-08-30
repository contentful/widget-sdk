import React from 'react';
import notification from 'notification';
import spaceContext from 'spaceContext';
import $state from '$state';
import modalDialog from 'modalDialog';
import { track } from 'analytics/Analytics';
import { toInternalFieldType } from './FieldTypes';
import getExtensionParameterIds from './getExtensionParameterIds';

const SDK_URL = 'https://unpkg.com/contentful-ui-extensions-sdk@3';

export function openExamplePicker() {
  return modalDialog
    .open({
      template:
        '<react-component class="modal-background" name="app/Extensions/ExamplePicker" props="props" />',
      controller: $scope => {
        $scope.props = {
          onConfirm: value => $scope.dialog.confirm(value),
          onCancel: err => $scope.dialog.cancel(err instanceof Error ? err : { cancelled: true })
        };
      }
    })
    .promise.then(install)
    .catch(handleInstallError);
}

export function openGitHubInstaller(extensionUrl) {
  return modalDialog
    .open({
      template:
        '<react-component class="modal-background" name="app/Extensions/GitHubInstaller" props="props" />',
      controller: $scope => {
        $scope.props = {
          extensionUrl: extensionUrl || '',
          onConfirm: value => $scope.dialog.confirm(value),
          onCancel: err => $scope.dialog.cancel(err instanceof Error ? err : { cancelled: true })
        };
      }
    })
    .promise.then(install)
    .catch(handleInstallError);
}

export function createExtension() {
  return install({
    extension: {
      name: 'New extension',
      fieldTypes: [{ type: 'Symbol' }],
      srcdoc:
        [
          '<!DOCTYPE html>',
          `<script src="${SDK_URL}"></script>`,
          '<script>',
          'window.contentfulExtension.init(function(api) {',
          '  console.log(api.field.getValue());',
          '});',
          '</script>'
        ].join('\n') + '\n'
    }
  }).catch(handleInstallError);
}

function install({ extension, type, url }) {
  return spaceContext.cma
    .createExtension({ extension })
    .then(res => $state.go('.detail', { extensionId: res.sys.id }))
    .then(() => {
      notification.info('Your new extension was successfully created.');

      if (type && url) {
        track('extension:install', {
          type,
          url,
          name: extension.name,
          src: extension.src,
          fieldTypes: toInternalFieldType(extension.fieldTypes),
          ...getExtensionParameterIds(extension)
        });
      }
    });
}

function handleInstallError(err) {
  const wasCancelled = err && Object.keys(err).length === 1 && err.cancelled === true;

  if (err && !wasCancelled) {
    notification.error('There was an error while creating your extension.');
    return Promise.reject(err);
  }
}

const Actions = () => (
  <React.Fragment>
    <button
      className="button btn-action add-entity"
      data-test-id="extensions.add"
      cf-context-menu-trigger="true">
      Add extension{' '}
      <i className="fa fa-chevron-down" style={{ color: 'rgba(255, 255, 255, .4)' }} />
    </button>
    <div className="context-menu x--arrow-right" cf-context-menu="bottom-right">
      <div role="menuitem" onClick={() => createExtension()} data-test-id="extensions.add.new">
        Add a new extension
      </div>
      <div role="menuitem" onClick={() => openExamplePicker()}>
        Install an example
      </div>
      <div role="menuitem" onClick={() => openGitHubInstaller()}>
        Install from GitHub
      </div>
    </div>
  </React.Fragment>
);

export default Actions;
