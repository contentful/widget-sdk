import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  SelectField,
  FieldGroup,
  RadioButtonField,
  Button,
  Paragraph,
  Typography,
  Form,
} from '@contentful/forma-36-react-components';
import defaultLocalesList from 'libs/locales_list.json';
import TemplatesList from 'components/shared/space-wizard/TemplatesList';
import { requestSpaceCreation } from './utils';
import { useAsync } from 'app/common/hooks';
import { getTemplatesList } from 'services/SpaceTemplateLoader';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  inlineInputGroup: css({
    display: 'flex',
  }),
  selectLocale: css({
    paddingLeft: tokens.spacingXl,
    width: '100%',
  }),
  orgName: css({
    fontWeight: tokens.fontWeightMedium,
  }),
};

const NewSpaceModal = ({
  onModalClose,
  setTemplateProgress,
  setCreationFinished,
  organization,
  spaceContext,
}) => {
  const localesList = defaultLocalesList.map((locale) => ({
    displayName: locale.name + ' (' + locale.code + ')',
    code: locale.code,
  }));
  const [templates, setTemplates] = useState(undefined);
  const [selectedTemplate, setSelectedTemplate] = useState(templates && templates[0]);

  const getTemplates = useCallback(async () => {
    const templates = await getTemplatesList().then((templates) => {
      return templates.reduce((acc, template) => {
        if (!template.fields.blank) {
          const fields = { ...template.fields, sys: template.sys };
          acc.push(fields);
        }
        return acc;
      }, []);
    });
    setTemplates(templates);
    setSelectedTemplate(templates[0]);
  }, []);

  useAsync(getTemplates);

  const [useTemplate, setUseTemplate] = useState(false);
  const [defaultLocale, setDefaultLocale] = useState('en-US');
  const [error, setError] = useState('');
  const [spaceName, setSpaceName] = useState('');
  const [spaceCreationInProgress, setSpaceCreation] = useState(false);

  return (
    <div>
      <Typography>
        <Paragraph>
          A space is a place where you keep all the content related to a single project.
        </Paragraph>
        <Paragraph>
          You are creating this space for the organization{' '}
          <i className={styles.orgName}>{organization.name}</i>.
        </Paragraph>
      </Typography>
      <Form>
        <div className={styles.inlineInputGroup}>
          <TextField
            disabled={spaceCreationInProgress}
            labelText={'Space name'}
            id={'newspace-name'}
            name={'newspace-name'}
            validationMessage={error}
            value={spaceName}
            required={true}
            onChange={({ target: { value } }) => {
              if (value.trim() === '') {
                setError('Please, fill in this field');
                return;
              } else {
                setError('');
              }
              setSpaceName(value);
            }}
          />
          {!useTemplate && (
            <SelectField
              className={styles.selectLocale}
              isDisabled={spaceCreationInProgress}
              labelText={'Language'}
              name={'language-select'}
              value={defaultLocale}
              testId={'select-locale'}
              id={'newspace-language'}
              onChange={({ target: { value } }) => setDefaultLocale(value)}>
              {localesList.map((locale) => (
                <option key={locale.code} value={locale.code}>
                  {locale.displayName}
                </option>
              ))}
            </SelectField>
          )}
        </div>
        <FieldGroup>
          <RadioButtonField
            disabled={spaceCreationInProgress}
            labelText={'Create an empty space'}
            helpText={'I’ll fill it with my own content'}
            name="useTemplate"
            checked={!useTemplate}
            value={'empty-space'}
            onChange={({ target: { value } }) => setUseTemplate(value === 'template-space')}
            id="newspace-template-none"
          />
          <RadioButtonField
            disabled={spaceCreationInProgress}
            labelText={'Create an example space'}
            helpText={'I’d like to see how things work first'}
            name="useTemplate"
            checked={useTemplate}
            value={'template-space'}
            onChange={({ target: { value } }) => setUseTemplate(value === 'template-space')}
            id="newspace-template-usetemplate"
          />
        </FieldGroup>
        {templates && useTemplate && (
          <TemplatesList
            templates={templates}
            selectedTemplate={selectedTemplate}
            onSelect={setSelectedTemplate}
          />
        )}
      </Form>
      <Button
        buttonType="primary"
        disabled={spaceCreationInProgress || !!error}
        loading={spaceCreationInProgress}
        onClick={() => {
          if (spaceName.trim() === '') {
            setError('Please, fill in this field');
            return;
          }
          setSpaceCreation(true);
          requestSpaceCreation(
            { defaultLocale, name: spaceName },
            organization,
            spaceContext,
            useTemplate && selectedTemplate,
            onModalClose,
            setTemplateProgress,
            setCreationFinished
          );
        }}
        testId="create-space"
        type="button">
        Create space
      </Button>
    </div>
  );
};

NewSpaceModal.propTypes = {
  onModalClose: PropTypes.func.isRequired,
  setTemplateProgress: PropTypes.func.isRequired,
  setCreationFinished: PropTypes.func.isRequired,
  organization: PropTypes.object.isRequired,
  spaceContext: PropTypes.object.isRequired,
};

export default NewSpaceModal;
