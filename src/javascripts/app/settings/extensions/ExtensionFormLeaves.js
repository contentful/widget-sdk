import React from 'react';
import PropTypes from 'prop-types';
import { Controlled as CodeMirror } from 'react-codemirror2';
import { get } from 'lodash';
import WidgetParametersForm from 'widgets/WidgetParametersForm';
import * as WidgetParametersUtils from 'widgets/WidgetParametersUtils';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';

const DEFAULT_CM_HEIGHT = '400px';

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'add-new-extension',
  campaign: 'in-app-help',
});

const Label = ({ text, info }) => {
  return (
    <label>
      <span className="extension-form__label">{text}</span>
      {info && <span className="extension-form__label-info"> ({info})</span>}
    </label>
  );
};

const Editor = ({ height, value, onChange, options }) => {
  return (
    <div className={`extension-form__cm${options.readOnly ? ' x--readonly' : ''}`}>
      <CodeMirror
        editorDidMount={(editor) => {
          editor.setSize(null, height || DEFAULT_CM_HEIGHT);
        }}
        value={value || ''}
        onBeforeChange={(_editor, _data, value) => {
          onChange(value);
        }}
        options={options}
      />
    </div>
  );
};

const ExtensionParameters = ({ entity, onChange }) => {
  const definitions = get(entity, ['extension', 'parameters', 'installation']) || [];

  return (
    <React.Fragment>
      {definitions.length > 0 && (
        <WidgetParametersForm
          definitions={definitions}
          values={entity.parameters || {}}
          missing={WidgetParametersUtils.markMissingValues(definitions, entity.parameters)}
          updateValue={(id, value) => {
            const updated = { ...entity.parameters, [id]: value };
            onChange(WidgetParametersUtils.filterValues(definitions, updated));
          }}
        />
      )}

      <div className="cfnext-form__field">
        <Label text="Parameter definitions" info="read only" />
        <p>
          You can set parameter definitions using the{' '}
          <a
            href={withInAppHelpUtmParams(
              'https://www.contentful.com/developers/docs/references/content-management-api/#/reference/ui-extensions/configuration-parameters'
            )}
            target="_blank"
            rel="noopener noreferrer">
            Content Management API
          </a>
          .
        </p>
        <Editor
          value={JSON.stringify(
            {
              instance: get(entity, ['extension', 'parameters', 'instance']) || [],
              installation: definitions,
            },
            null,
            2
          )}
          options={{ mode: 'javascript', lineNumbers: true, readOnly: 'nocursor' }}
        />
      </div>
    </React.Fragment>
  );
};

Editor.propTypes = {
  height: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  options: PropTypes.object.isRequired,
};

Label.propTypes = {
  text: PropTypes.string.isRequired,
  info: PropTypes.string,
};

ExtensionParameters.propTypes = {
  entity: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

export { Label, Editor, ExtensionParameters };
