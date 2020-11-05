import * as React from 'react';
import { CheckboxField, Subheading } from '@contentful/forma-36-react-components';
import { Internal } from './RoleTypes';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

type Props = {
  internal: Internal;
  canModifyRoles: boolean;
  updateRoleFromCheckbox: (path: string) => (...args) => void;
  hasContentTagsFeature: boolean;
  hasEnvironmentAliasesEnabled: boolean;
};

const styles = {
  subHeading: css({
    marginBottom: tokens.spacingM,
  }),
  block: css({
    marginBottom: tokens.spacingL,
  }),
  checkbox: css({
    marginBottom: tokens.spacingM,
  }),
};

const RoleEditorPermissions: React.FC<Props> = ({
  internal,
  canModifyRoles,
  updateRoleFromCheckbox,
  hasContentTagsFeature,
  hasEnvironmentAliasesEnabled,
}) => {
  return (
    <>
      <Subheading className={styles.subHeading}>Content model</Subheading>
      <div className={styles.subHeading}>
        <CheckboxField
          id="opt_content_types_access"
          name="opt_content_types_access"
          labelIsLight
          labelText="Can modify content types"
          helpText="The content type builder is only shown to users who have this permission"
          disabled={!canModifyRoles}
          checked={internal.contentModel.manage}
          onChange={updateRoleFromCheckbox('contentModel.manage')}
          inputType="checkbox"
          className={styles.checkbox}
        />
      </div>
      {hasContentTagsFeature && (
        <>
          <Subheading className={styles.subHeading}>Tags</Subheading>
          <div className={styles.block}>
            <CheckboxField
              id="opt_tags_access"
              name="opt_tags_access"
              labelIsLight
              labelText="Can create and manage tags"
              disabled={!canModifyRoles}
              checked={internal.tags.manage}
              onChange={updateRoleFromCheckbox('tags.manage')}
              inputType="checkbox"
              className={styles.checkbox}
            />
          </div>
        </>
      )}
      <>
        <Subheading className={styles.subHeading}>API keys</Subheading>
        <div className={styles.block}>
          <CheckboxField
            id="opt_api_keys_view"
            name="opt_api_keys_view"
            labelIsLight
            labelText="Can access existing API keys for this space."
            disabled={!canModifyRoles || internal.contentDelivery.manage}
            checked={internal.contentDelivery.read}
            onChange={updateRoleFromCheckbox('contentDelivery.read')}
            inputType="checkbox"
            className={styles.checkbox}
          />
          <CheckboxField
            id="opt_space_settings_edit"
            name="opt_space_settings_edit"
            labelText="Can create and update API keys for this space."
            labelIsLight
            disabled={!canModifyRoles}
            checked={internal.contentDelivery.manage}
            onChange={updateRoleFromCheckbox('contentDelivery.manage')}
            inputType="checkbox"
            className={styles.checkbox}
          />
        </div>
      </>
      <Subheading className={styles.subHeading}>Environments settings</Subheading>
      <div className={styles.block}>
        <CheckboxField
          id="opt_manage_environments_access"
          name="opt_manage_environments_access"
          disabled={!canModifyRoles}
          labelText="Can manage and use all environments for this space."
          helpText="Content level permissions only apply to the master environment and will not have an effect in non-master environments"
          labelIsLight
          checked={internal.environments.manage}
          onChange={updateRoleFromCheckbox('environments.manage')}
          inputType="checkbox"
          className={styles.checkbox}
        />
        {hasEnvironmentAliasesEnabled && (
          <label className="cfnext-form-option">
            <CheckboxField
              id="opt_manage_environment_aliases_access"
              name="opt_manage_environment_aliases_access"
              disabled={!canModifyRoles || !internal.environments.manage}
              checked={internal.environments.manage && internal.environmentAliases.manage}
              onChange={updateRoleFromCheckbox('environmentAliases.manage')}
              inputType="checkbox"
              labelText="Can create environment aliases and change their target environment for this space."
              labelIsLight
              className={styles.checkbox}
            />
          </label>
        )}
      </div>
      <Subheading className={styles.subHeading}>Space settings</Subheading>
      <div className={styles.block}>
        <CheckboxField
          id="opt_space_settings_access"
          name="opt_space_settings_access"
          disabled={!canModifyRoles}
          checked={internal.settings.manage}
          onChange={updateRoleFromCheckbox('settings.manage')}
          inputType="checkbox"
          labelIsLight
          labelText="Can modify space settings."
          helpText="This permission allows users to modify locales, webhooks, apps,
              the space name, and logo image. It does not grant permission to modify the roles or access of a user or team to this space. This
              permission does not allow users to delete the space."
          className={styles.checkbox}
        />
      </div>
    </>
  );
};

export { RoleEditorPermissions };
