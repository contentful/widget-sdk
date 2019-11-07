import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import KeyEditorWorkbench from './KeyEditorWorkbench';
import { inRange, isEqual, get, assignWith } from 'lodash';
import { DocsLink } from 'ui/Content.es6';
import { track } from 'analytics/Analytics';
import EnvironmentSelector from './EnvironmentSelector';
import { concat, assign } from 'utils/Collections.es6';
import {
  TextField,
  Heading,
  Form,
  Note,
  Subheading,
  Typography,
  Paragraph
} from '@contentful/forma-36-react-components';
import KeyEditorActions from './KeyEditorActions';
import { getApiKeyRepo } from 'app/settings/api/services/ApiKeyRepoInstance';
import * as Navigator from 'states/Navigator.es6';
import { Notification } from '@contentful/forma-36-react-components';
import * as logger from 'services/logger.es6';

const styles = {
  readOnlyNote: css({
    marginBottom: tokens.spacingL
  }),
  separatorStyle: css({
    height: '1px',
    width: tokens.contentWidthFull,
    backgroundColor: tokens.colorElementMid,
    margin: `${tokens.spacingXl} 0`
  }),
  sectionTitle: css({
    margin: '0 0 18px 0',
    fontWeight: 'bold',
    lineHeight: 1,
    display: 'flex',
    fontSize: '18px',
    '&:after': {
      marginLeft: '10px',
      content: '""',
      height: '1px',
      marginTop: '10px',
      backgroundColor: '#e5ebed',
      flexGrow: 1
    }
  }),
  section: css({
    marginTop: tokens.spacingL
  })
};

const trackCopy = source => track('api_key:clipboard_copy', { source });

function isApiKeyModelEqual(m1, m2) {
  const sortedIds = envs =>
    (envs || [])
      .map(env => env.sys.id)
      .sort()
      .join(',');
  return isEqual(
    { ...m1, environments: sortedIds(m1.environments) },
    { ...m2, environments: sortedIds(m2.environments) }
  );
}

const notify = {
  saveSuccess: function(apiKey) {
    Notification.success(`“${apiKey.name}” saved successfully`);
  },

  saveFail: function(error, apiKey) {
    Notification.error(`“${apiKey.name}” could not be saved`);
    // HTTP 422: Unprocessable entity
    if (get(error, 'statusCode') !== 422) {
      logger.logServerWarn('ApiKey could not be saved', { error });
    }
  },

  saveNoEnvironments: function(aliasesExist) {
    if (aliasesExist) {
      Notification.error('At least one environment or alias has to be selected.');
    } else {
      Notification.error('At least one environment has to be selected.');
    }
  },

  deleteSuccess: function(apiKey) {
    Notification.success(`“${apiKey.name}” deleted successfully`);
  },

  deleteFail: function(error, apiKey) {
    Notification.error(`“${apiKey.name}” could not be deleted`);
    logger.logServerWarn('ApiKey could not be deleted', { error });
  }
};

export default function KeyEditor({
  canEdit,
  canCreate,
  spaceId,
  environmentsEnabled,
  isAdmin,
  spaceAliases,
  spaceEnvironments,
  registerSaveAction,
  setDirty,
  ...restProps
}) {
  const [apiKey, setApiKey] = useState(restProps.apiKey);

  const pristineModel = {
    name: {
      value: apiKey.name || '',
      minLength: 1,
      maxLength: 41
    },
    description: {
      value: apiKey.description || '',
      minLength: 0,
      maxLength: 256
    },
    environments: concat(
      [],
      apiKey.environments || [{ sys: { id: 'master', type: 'Link', linkType: 'Environment' } }]
    )
  };

  const [model, update] = useState(pristineModel);

  const dirty = !isApiKeyModelEqual(pristineModel, model);

  const isSaveDisabled = () => {
    return (
      !inRange(model.name.value.length, model.name.minLength, model.name.maxLength) ||
      !inRange(
        model.description.value.length,
        model.description.minLength,
        model.description.maxLength
      ) ||
      !canCreate ||
      !dirty
    );
  };

  const onRemove = async () => {
    try {
      await getApiKeyRepo().remove(apiKey.sys.id);
      await Navigator.go({
        path: '^.list'
      });
      notify.deleteSuccess(apiKey);
    } catch (err) {
      notify.deleteFail(err, apiKey);
    }
  };

  const onSave = useCallback(async () => {
    if (model.environments.length < 1) {
      notify.saveNoEnvironments(model.aliasesExist);
      return Promise.reject();
    }

    const toPersist = assignWith({}, Object.assign({}, apiKey, model), (_objValue, srcVal, key) => {
      if (key === 'name' || key === 'description') {
        return srcVal.value || '';
      }
    });

    try {
      const newKey = await getApiKeyRepo().save(toPersist);
      setApiKey(newKey);
      notify.saveSuccess(newKey);
    } catch (err) {
      notify.saveFail(err, apiKey);
    }
  }, [apiKey, model]);

  useEffect(() => {
    registerSaveAction(onSave);
  }, [apiKey, model, registerSaveAction, onSave]);

  useEffect(() => {
    setDirty(dirty);
  }, [setDirty, dirty]);

  return (
    <KeyEditorWorkbench
      title={`${model.name.value || 'New Api Key'}${dirty ? '*' : ''}`}
      actions={
        canEdit ? (
          <KeyEditorActions
            onRemove={onRemove}
            onSave={onSave}
            isDeleteDisabled={!canEdit}
            isSaveDisabled={isSaveDisabled()}
          />
        ) : null
      }>
      {!canEdit && (
        <Note noteType="warning" className={styles.readOnlyNote}>
          You have read-only access to this API key. If you need to edit it please contact your
          administrator.
        </Note>
      )}
      <Form>
        <Heading className={styles.sectionTitle}>Access tokens</Heading>
        <div>
          To query and get content using the APIs, client applications need to authenticate with
          both the Space ID and an access token.
        </div>
        <Input
          canEdit={canEdit}
          model={model}
          name="name"
          update={update}
          isRequired={true}
          label="Name"
          description="Can be platform or device specific names (i.e. marketing website, tablet, VR app)"
        />
        <Input
          canEdit={canEdit}
          model={model}
          name="description"
          update={update}
          label="Description"
          description="You can provide an optional description for reference in the future"
        />
        <InputWithCopy
          value={spaceId}
          name="space-id"
          label="Space ID"
          track={() => trackCopy('space')}
        />
        <InputWithCopy
          key="content-delivery-api"
          value={apiKey.accessToken}
          name="delivery-token"
          track={() => {
            trackCopy('cda');
          }}
          label="Content Delivery API - access token"
        />
        <Separator key="content-preview-api-separator" />
        <InputWithCopy
          key="content-preview-api"
          value={get(apiKey, 'preview_api_key.accessToken', '')}
          name="preview-token"
          track={() => {
            trackCopy('cpa');
          }}
          label="Content Preview API - access token"
          description={
            <React.Fragment>
              Preview unpublished content using this API (i.e. content with “Draft” status).{' '}
              <DocsLink key="content-preview-link" text="Read more" target="content_preview" />
            </React.Fragment>
          }
        />
        {environmentsEnabled && (
          <>
            <Separator />
            <Section
              title={spaceAliases.length ? 'Environments & Environment Aliases' : 'Environments'}
              description={
                spaceAliases.length
                  ? 'Select the environments and aliases this API key should have access to. At least one environment or alias has to be selected.'
                  : 'Select the environments this API key should have access to. At least one environment has to be selected.'
              }>
              <EnvironmentSelector
                {...{
                  canEdit,
                  isAdmin,
                  spaceEnvironments,
                  spaceAliases,
                  selectedEnvOrAliasLabel: model.environments,
                  updateEnvOrAliasLabel: environments => update(assign(model, { environments }))
                }}
              />
            </Section>
          </>
        )}
      </Form>
    </KeyEditorWorkbench>
  );
}

KeyEditor.propTypes = {
  apiKey: PropTypes.shape({
    sys: PropTypes.shape({
      id: PropTypes.string
    }).isRequired,
    name: PropTypes.string,
    description: PropTypes.string,
    accessToken: PropTypes.string.isRequired,
    preview_api_key: PropTypes.shape({
      accessToken: PropTypes.string.isRequired
    }).isRequired,
    environments: PropTypes.array
  }),
  spaceId: PropTypes.string.isRequired,
  canEdit: PropTypes.bool.isRequired,
  canCreate: PropTypes.bool.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  environmentsEnabled: PropTypes.bool.isRequired,
  spaceAliases: PropTypes.array.isRequired,
  spaceEnvironments: PropTypes.array.isRequired,
  registerSaveAction: PropTypes.func.isRequired,
  setDirty: PropTypes.func.isRequired
};

KeyEditor.defaultProps = {
  spaceAliases: []
};

/* eslint-disable react/prop-types */
function Input({ canEdit, model, update, name, isRequired = false, label, description }) {
  const hasError = !inRange(model[name].value.length, model[name].minLength, model[name].maxLength);
  const textInputProps = {
    type: 'text',
    value: model[name].value,
    onChange: e => update(assign(model, { [name]: { ...model[name], value: e.target.value } })),
    disabled: !canEdit,
    error: hasError ? 'error' : undefined
  };
  const formLabelProps = isRequired
    ? {
        htmlFor: name
      }
    : {};

  return (
    <TextField
      id={name}
      name={name}
      labelText={label}
      helpText={description}
      required={isRequired}
      validationMessage={
        hasError
          ? `This field needs to be between ${model[name].minLength} and ${model[name].maxLength -
              1} characters`
          : undefined
      }
      textInputProps={textInputProps}
      formLabelProps={formLabelProps}
    />
  );
}

function InputWithCopy({ value, name, track, label, description = '' }) {
  const textInputProps = {
    onCopy: track,
    withCopyButton: true,
    disabled: true
  };

  return (
    <TextField
      id={name}
      name={name}
      labelText={label}
      helpText={description}
      value={value}
      textInputProps={textInputProps}
    />
  );
}

function Separator() {
  return <div className={styles.separatorStyle} />;
}

function Section({ title, description, children }) {
  return (
    <div>
      <Typography>
        <Subheading className="h-reset">{title}</Subheading>
        {description && <Paragraph>{description}</Paragraph>}
      </Typography>
      <div className={styles.section}>{children}</div>
    </div>
  );
}
