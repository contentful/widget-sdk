import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  CheckboxField,
  TextField,
  FormLabel,
  Paragraph,
  TextLink,
  RadioButtonField,
  Typography,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

import { EXTENSION_FIELD_TYPES } from 'widgets/FieldTypes';
import { Editor, ExtensionParameters } from './ExtensionFormLeaves';

const EXTENSION_URL_RE = /(^https:\/\/)|(^http:\/\/localhost(:[0-9]+)?(\/|$))/;

const styles = {
  checkboxLabel: css({
    display: 'inline-block',
    fontWeight: tokens.fontWeightNormal,
    marginRight: tokens.spacingS,
  }),
  checkbox: css({
    verticalAlign: 'top',
  }),
  sectionHeader: css({
    display: 'block',
    fontSize: tokens.fontSizeM,
    marginBottom: tokens.spacingXs,
  }),
  legacyExtension: css({
    marginBottom: tokens.spacingM,
  }),
  legacySidebarText: css({
    color: tokens.colorTextDark,
  }),
  extensionHosting: css({
    marginBottom: tokens.spacingM,
  }),
  hostingOption: css({
    display: 'block',
    fontWeight: tokens.fontWeightNormal,
  }),
  invalidURL: css({
    color: tokens.colorNegative,
  }),
};

export const ExtensionForm = ({ entity, selfHosted, updateEntity, setSelfHosted }) => {
  const invalidUrl = !EXTENSION_URL_RE.test(entity.extension.src || '');

  const updateExtensionProp = (prop, value) => {
    return updateEntity({ ...entity, extension: { ...entity.extension, [prop]: value } });
  };

  return (
    <React.Fragment>
      <Form>
        <TextField
          required={true}
          labelText="Name"
          name="name"
          id="name"
          maxLength={255}
          value={entity.extension.name || ''}
          validationMessage={!entity.extension.name && 'This value is required.'}
          onChange={(e) => {
            const value = e.target.value || '';
            updateExtensionProp('name', value.length > 0 ? value : undefined);
          }}
        />
        <div>
          <FormLabel element={'h3'} className={styles.sectionHeader} required={true}>
            Field types
          </FormLabel>
          {EXTENSION_FIELD_TYPES.map((type) => {
            return (
              <FormLabel key={type} className={styles.checkboxLabel}>
                <CheckboxField
                  className={styles.checkbox}
                  checked={entity.extension.fieldTypes.includes(type)}
                  onChange={() => {
                    const cur = entity.extension.fieldTypes;
                    const next = cur.includes(type)
                      ? cur.filter((t) => t !== type)
                      : cur.concat([type]);
                    updateExtensionProp('fieldTypes', next);
                  }}
                />
                {type}
              </FormLabel>
            );
          })}
        </div>
      </Form>

      <div className={styles.legacyExtension}>
        <FormLabel element={'h3'} className={styles.sectionHeader} required={true}>
          Legacy sidebar extension
        </FormLabel>
        <Typography>
          <Paragraph className={styles.legacySidebarText}>
            Sidebar extension, if used with a field control, will remove itself from the entry
            editor and instead render itself the sidebar.
          </Paragraph>
        </Typography>
        <FormLabel className={styles.checkboxLabel}>
          <CheckboxField
            checked={entity.extension.sidebar}
            onChange={() => updateExtensionProp('sidebar', !entity.extension.sidebar)}
          />
          Yes, this is a legacy sidebar extension
        </FormLabel>
      </div>

      <div className={styles.extensionHosting}>
        <FormLabel element={'h3'} className={styles.sectionHeader} required={true}>
          Hosting
        </FormLabel>
        <FormLabel className={styles.hostingOption}>
          <RadioButtonField checked={selfHosted} onChange={() => setSelfHosted(true)} />
          Self-hosted (<code>src</code>)
        </FormLabel>
        <FormLabel className={styles.hostingOption}>
          <RadioButtonField checked={!selfHosted} onChange={() => setSelfHosted(false)} />
          Hosted by Contentful (<code>srcdoc</code>)
        </FormLabel>
      </div>

      {selfHosted && (
        <div className={styles.extensionHosting}>
          <TextField
            required={true}
            labelText="Self-hosted URL"
            name="self-hosted-url"
            id="self-hosted-url"
            value={entity.extension.src || ''}
            onChange={(e) => updateExtensionProp('src', e.target.value)}
          />
          {invalidUrl && (
            <Paragraph testId={'ext-url-error'} className={styles.invalidURL}>
              Valid URLs use{' '}
              <code>
                https:
                {'//'}
              </code>
              . Only <code>localhost</code> can be used with{' '}
              <code>
                http:
                {'//'}
              </code>
              .
            </Paragraph>
          )}
        </div>
      )}

      {!selfHosted && (
        <div className={styles.codeBlock}>
          <FormLabel element={'h3'} className={styles.sectionHeader} required={true}>
            Code
          </FormLabel>
          <Typography>
            <Paragraph>
              Maximum accepted code size is 200KB. For a larger size use the self-hosted option.{' '}
              <br />
              You can also develop your extensions locally. Learn about the{' '}
              <TextLink
                href="https://github.com/contentful/extensions#managing-extensions"
                target="_blank"
                rel="noopener noreferrer">
                CLI based development flow
              </TextLink>
              .
            </Paragraph>
          </Typography>
          <Editor
            height="700px"
            value={entity.extension.srcdoc}
            onChange={(value) => updateExtensionProp('srcdoc', value)}
            options={{ mode: 'htmlmixed', lineNumbers: true, tabSize: 2 }}
          />
        </div>
      )}

      <ExtensionParameters
        entity={entity}
        onChange={(values) => updateEntity({ ...entity, parameters: values })}
      />
    </React.Fragment>
  );
};

ExtensionForm.propTypes = {
  entity: PropTypes.object.isRequired,
  selfHosted: PropTypes.bool.isRequired,
  updateEntity: PropTypes.func.isRequired,
  setSelfHosted: PropTypes.func.isRequired,
};
