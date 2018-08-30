import React from 'react';
import PropTypes from 'prop-types';
import spaceContext from 'spaceContext';
import notification from 'notification';
import $state from '$state';
import { get } from 'lodash';

const StateLink = ({ path, params, options, ...rest }) => (
  <a
    href={$state.href(path, params)}
    onClick={e => {
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        // allow to open in a new tab/window normally
      } else {
        // perform Angular UI router transition only
        e.preventDefault();
        $state.go(path, params, options);
      }
    }}
    {...rest}
  />
);

StateLink.propTypes = {
  path: PropTypes.string.isRequired,
  params: PropTypes.object,
  options: PropTypes.object
};

function deleteExtension({ id }, refresh) {
  return spaceContext.cma
    .deleteExtension(id)
    .then(refresh)
    .then(
      () => notification.info('Your extension was successfully deleted.'),
      err => {
        notification.error('There was an error while deleting your extension.');
        return Promise.reject(err);
      }
    );
}

const DeleteButton = ({ extension, refresh }) => (
  <div>
    <button
      cf-context-menu-trigger="cf-context-menu-trigger"
      className="text-link--destructive"
      data-test-id={`extensions.delete.${extension.id}`}>
      Delete
    </button>
    <div cf-context-menu="bottom-right" className="delete-confirm context-menu x--arrow-right">
      <p>
        You are about to remove the extension <strong>{extension.name}</strong>. If the extension is
        in use in any content type you will have to pick a different appearance for the field using
        it.
      </p>
      <button
        className="btn-caution"
        data-test-id={`extensions.deleteConfirm.${extension.id}`}
        onClick={() => deleteExtension(extension, refresh)}>
        Delete
      </button>
      <button className="btn-secondary-action">Cancel</button>
    </div>
  </div>
);

DeleteButton.propTypes = {
  extension: PropTypes.object.isRequired,
  refresh: PropTypes.func.isRequired
};

export default class ExtensionsList extends React.Component {
  static propTypes = {
    extensions: PropTypes.arrayOf(PropTypes.shape().isRequired).isRequired,
    refresh: PropTypes.func.isRequired
  };

  render() {
    const { extensions, refresh } = this.props;

    const body = extensions.map(extension => (
      <tr key={extension.id}>
        <td>
          <StateLink path=".detail" params={{ extensionId: extension.id }}>
            {extension.name}
          </StateLink>
        </td>
        <td>
          {typeof extension.src === 'string' && 'self-hosted'}
          {typeof extension.srcdoc === 'string' && 'Contentful'}
        </td>
        <td>{extension.fieldTypes.join(', ')}</td>
        <td>{`${get(extension, ['parameters', 'length'], 0)} definition(s)`}</td>
        <td>
          {`${get(
            extension,
            ['installationParameters', 'definitions', 'length'],
            0
          )} definition(s)`}
          <br />
          {`${
            Object.keys(get(extension, ['installationParameters', 'values'], {})).length
          } value(s)`}
        </td>
        <td className="x--small-cell">
          <StateLink path=".detail" params={{ extensionId: extension.id }}>
            <span style={{ textDecoration: 'underline' }}>Edit</span>
          </StateLink>
          <DeleteButton extension={extension} refresh={refresh} />
        </td>
      </tr>
    ));

    return (
      <div data-test-id="extensions.list" style={{ padding: '0 1em' }}>
        <table className="simple-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Hosting</th>
              <th>Field type(s)</th>
              <th>Instance parameters</th>
              <th>Installation parameters</th>
              <th className="x--small-cell">Actions</th>
            </tr>
          </thead>
          <tbody>{body}</tbody>
        </table>
      </div>
    );
  }
}
