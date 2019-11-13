import React from 'react';
import PropTypes from 'prop-types';
import { Controlled as CodeMirror } from 'react-codemirror2';
import { throttle } from 'lodash';

const TRANSFORMATION_EXAMPLE = {
  entityId: '{ /payload/sys/id }',
  spaceId: '{ /payload/sys/space/sys/id }',
  parameters: {
    text: 'Entity version: { /payload/sys/version }'
  }
};

const CODE_MIRROR_OPTIONS = {
  mode: 'application/json',
  lineNumbers: true,
  tabSize: 2,
  lineWrapping: true
};

const refreshCodeMirror = throttle(editor => {
  if (editor) {
    editor.setSize(null, '250px');
    editor.refresh();
  }
}, 300);

export default class WebhookBodyTransformation extends React.Component {
  static propTypes = {
    body: PropTypes.string,
    onChange: PropTypes.func.isRequired
  };

  editor = null;

  constructor(props) {
    super(props);
    // `this.last` stores the last recorded value of the editor.
    // It's used to restore its value when changing from "custom payload"
    // to "default payload" and then to "custom payload" again.
    this.last = typeof props.body === 'string' ? props.body : '';
  }

  componentDidUpdate() {
    refreshCodeMirror(this.editor);
  }

  render() {
    const { body, onChange } = this.props;
    const hasBodyTransformation = typeof body === 'string';

    return (
      <div className="cfnext-form__field">
        <p>
          You can customize the webhook payload to match the format expected by the service your
          webhook calls.{' '}
          <a
            href="https://www.contentful.com/developers/docs/concepts/webhooks/"
            target="_blank"
            rel="noopener noreferrer">
            View documentation
          </a>
        </p>
        <div className="webhook-editor__settings-option">
          <label>
            <input
              type="radio"
              checked={!hasBodyTransformation}
              onChange={() => onChange(undefined)}
            />{' '}
            Use default payload
          </label>
        </div>
        <div className="webhook-editor__settings-option">
          <label>
            <input
              type="radio"
              data-test-id="customize-webhook-payload"
              checked={hasBodyTransformation}
              onChange={() => onChange(this.last)}
            />{' '}
            Customize the webhook payload
          </label>
        </div>
        {hasBodyTransformation && (
          <div className="webhook-editor__settings_payload">
            <CodeMirror
              editorDidMount={el => {
                this.editor = el;
              }}
              options={CODE_MIRROR_OPTIONS}
              value={body}
              onBeforeChange={(_editor, _data, value) => {
                this.last = value;
                onChange(value);
              }}
            />
          </div>
        )}
        {hasBodyTransformation && (
          <div className="entity-editor__field-hint">
            <p>
              Custom payload can be any valid JSON value. To resolve a value from the original
              webhook payload use a JSON pointer wrapped with curly braces.
            </p>
            <label>Example:</label>
            <pre>{JSON.stringify(TRANSFORMATION_EXAMPLE, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  }
}
