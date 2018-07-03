import React from 'react';
import PropTypes from 'prop-types';
import Workbench from 'app/WorkbenchReact';
import $state from '$state';
import CodeMirror from 'react-codemirror';
import notification from 'notification';

const CONTAINER_STYLE = {padding: '0 1em'};
const CM_STYLE = {border: '1px solid #ddd', borderRadius: '3px'};
const INVOKE_STYLE = {marginTop: '40px', display: 'flex', justifyContent: 'space-between'};
const INVOKE_COL_STYLE = {width: '48%'};
const LABEL_STYLE = {display: 'block', paddingBottom: '10px'};

const CM_OPTIONS = {mode: 'javascript', lineNumbers: true, tabSize: 2};
const CM_OPTIONS_READ_ONLY = {...CM_OPTIONS, readOnly: 'nocursor'};

export default class FunctionEditor extends React.Component {
  static propTypes = {
    fn: PropTypes.object.isRequired,
    backend: PropTypes.object.isRequired
  }

  constructor (props) {
    super(props);
    this.state = {fn: props.fn, payload: '{}', useToken: true};
  }
  render () {
    return (
      <Workbench
        title={`Function "${this.state.fn.sys.id}"`}
        icon="page-settings"
        content={this.renderContent()}
        actions={this.renderActions()}
      />
    );
  }
  renderContent () {
    const {fn, payload, res, useToken} = this.state;

    return (
      <div style={CONTAINER_STYLE}>
        <div style={CM_STYLE}>
          <CodeMirror
            ref={el => el && el.getCodeMirror().setSize(null, '400px')}
            value={fn.code || ''}
            onChange={code => this.setState(s => ({...s, fn: {sys: s.fn.sys, code}}))}
            options={CM_OPTIONS}
          />
        </div>

        <div style={INVOKE_STYLE}>
          <div style={INVOKE_COL_STYLE}>
            <div style={LABEL_STYLE}>
              <strong>
                <code>POST {this.props.backend.getInvokeUri(fn.sys.id)}</code>
              </strong>
            </div>
            <div style={LABEL_STYLE}>
              <label>
                <input
                  type="checkbox"
                  checked={useToken}
                  onChange={e => {
                    const useToken = e.target.checked;
                    this.setState(s => ({...s, useToken}));
                  }}
                />
                Use my Web App CMA token
              </label>
            </div>
            <label style={LABEL_STYLE}>JSON payload:</label>
            <div style={CM_STYLE}>
              <CodeMirror
                ref={el => el && el.getCodeMirror().setSize(null, '200px')}
                value={payload || ''}
                onChange={payload => this.setState(s => ({...s, payload}))}
                options={CM_OPTIONS}
              />
            </div>
          </div>

          <div style={INVOKE_COL_STYLE}>
            {res && <React.Fragment key={JSON.stringify(res[1])}>
              <label style={LABEL_STYLE}>
                Response <code>{res[0]}</code>:
              </label>
              <div style={CM_STYLE}>
                <CodeMirror
                  ref={el => el && el.getCodeMirror().setSize(null, '500px')}
                  value={JSON.stringify(res[1], null, 2)}
                  options={CM_OPTIONS_READ_ONLY}
                />
              </div>
            </React.Fragment>}
          </div>
        </div>
      </div>
    );
  }
  renderActions () {
    return (
      <React.Fragment>
        <button
          className="btn-secondary-action"
          onClick={() => $state.go('.^', {}, {reload: true})}
        >
          Close
        </button>
        <button
          className="btn-primary-action"
          onClick={() => this.save()}
        >
          Save
        </button>
        <button
          className="btn-action"
          onClick={() => this.invoke()}
        >
          Invoke
        </button>
        <button
          className="btn-action"
          onClick={() => this.save().then(() => this.invoke())}
        >
          Save and invoke
        </button>
      </React.Fragment>
    );
  }
  save () {
    const {sys, code} = this.state.fn;
    return this.props.backend.update(sys.id, code).then(
      () => notification.info('Function saved successfully'),
      err => notification.error(`Error while updating your function: ${err.message}`)
    );
  }
  invoke () {
    const {fn, payload, useToken} = this.state;
    let body;

    try {
      body = JSON.parse(payload);
    } catch (err) {
      notification.error('Could not parse the JSON payload');
      return;
    }

    this.props.backend.invoke(fn.sys.id, body, !useToken).then(
      res => this.setState(s => ({...s, res})),
      err => notification.error(`Error while invoking your function: ${err.message}`)
    );
  }
}
