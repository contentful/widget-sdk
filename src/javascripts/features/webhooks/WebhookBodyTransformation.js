import React from 'react';
import PropTypes from 'prop-types';
import { Controlled as CodeMirror } from 'react-codemirror2';
import { throttle } from 'lodash';
import { CheckboxField, Paragraph, TextLink } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';

const TRANSFORMATION_EXAMPLE = {
  entityId: '{ /payload/sys/id }',
  spaceId: '{ /payload/sys/space/sys/id }',
  parameters: {
    text: 'Entity version: { /payload/sys/version }',
  },
};

const CODE_MIRROR_OPTIONS = {
  mode: 'application/json',
  lineNumbers: true,
  tabSize: 2,
  lineWrapping: true,
};

const refreshCodeMirror = throttle((editor) => {
  if (editor) {
    editor.setSize(null, '250px');
    editor.refresh();
  }
}, 300);

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'webhook-editor',
  campaign: 'in-app-help',
});

const styles = {
  checkbox: css({
    marginTop: tokens.spacingXs,
  }),
};

export class WebhookBodyTransformation extends React.Component {
  static propTypes = {
    body: PropTypes.string,
    onChange: PropTypes.func.isRequired,
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
        <Paragraph>
          You can customize the webhook payload to match the format expected by the service your
          webhook calls.{' '}
          <TextLink
            href={withInAppHelpUtmParams(
              'https://www.contentful.com/developers/docs/concepts/webhooks/'
            )}
            target="_blank"
            rel="noopener noreferrer">
            View documentation
          </TextLink>
        </Paragraph>
        <div className="webhook-editor__settings-option">
          <CheckboxField
            id={'default'}
            className={styles.checkbox}
            labelIsLight={true}
            checked={!hasBodyTransformation}
            labelText={'Use default payload'}
            onChange={() => onChange(undefined)}
          />
        </div>
        <div className="webhook-editor__settings-option">
          <CheckboxField
            id={'transformed'}
            className={styles.checkbox}
            labelIsLight={true}
            checked={hasBodyTransformation}
            labelText={'Customize the webhook payload'}
            onChange={() => onChange(this.last)}
          />
        </div>
        {hasBodyTransformation && (
          <div className="webhook-editor__settings_payload">
            <CodeMirror
              editorDidMount={(el) => {
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
            <Paragraph>
              Custom payload can be any valid JSON value. To resolve a value from the original
              webhook payload use a JSON pointer wrapped with curly braces.
            </Paragraph>
            <em>Example:</em>
            <pre>{JSON.stringify(TRANSFORMATION_EXAMPLE, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  }
}
