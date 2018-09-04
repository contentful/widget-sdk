import React from 'react';
import PropTypes from 'prop-types';
import Workbench from 'app/WorkbenchReact.es6';
import $state from '$state';
import notification from 'notification';

const CONTAINER_STYLE = { padding: '0 1em' };
const DEFAULT_CODE = 'module.exports = async ctx => ({statusCode: 200, body: ctx});';

export default class FunctionList extends React.Component {
  static propTypes = {
    fns: PropTypes.array.isRequired,
    backend: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = { fns: props.fns };
  }
  render() {
    return (
      <Workbench
        title={`Functions (${this.state.fns.length})`}
        icon="page-settings"
        content={this.renderContent()}
        actions={this.renderActions()}
      />
    );
  }
  renderContent() {
    const { fns } = this.state;

    if (fns.length < 1) {
      return <div style={CONTAINER_STYLE}>No functions yet</div>;
    }

    return (
      <table className="simple-table" style={CONTAINER_STYLE}>
        <thead>
          <tr>
            <th>Function name</th>
            <th className="x--small-cell">Actions</th>
          </tr>
        </thead>
        <tbody>
          {fns.map(fn => {
            return (
              <tr key={fn.sys.id}>
                <td>
                  <code>{fn.sys.id}</code>
                </td>
                <td className="x--small-cell">
                  <button className="text-link" onClick={() => this.edit(fn.sys.id)}>
                    Edit
                  </button>
                  <br />
                  <button className="text-link--destructive" onClick={() => this.remove(fn.sys.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }
  renderActions() {
    return (
      <button className="btn-action add-entity" onClick={() => this.create()}>
        Create a function
      </button>
    );
  }
  create() {
    const fnId = window.prompt('Please provide the ID of your function:');
    const valid = typeof fnId === 'string' && fnId.length > 0;

    if (!valid) {
      return;
    }

    this.props.backend
      .create({ sys: { id: fnId }, code: DEFAULT_CODE })
      .then(
        () => this.edit(fnId).then(() => notification.info('Function created successfully')),
        err => notification.error(`Error while creating your function: ${err.message}`)
      );
  }
  edit(fnId) {
    return $state.go('.detail', { fnId });
  }
  remove(fnId) {
    if (!window.confirm('Are you sure?')) {
      return;
    }

    this.props.backend.remove(fnId).then(
      () => {
        this.refresh();
        notification.info('Function deleted successfully');
      },
      err => notification.error(`Error while deleting your function: ${err.message}`)
    );
  }
  refresh() {
    this.props.backend
      .list()
      .then(
        res => this.setState({ fns: res.items }),
        err => notification.error(`Error while refreshing your functions: ${err.message}`)
      );
  }
}
