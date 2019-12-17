import React from 'react';
import { findIndex, set, update, remove, map } from 'lodash/fp';
import {
  flow,
  startsWith,
  get,
  includes,
  isString,
  isObject,
  extend,
  omit,
  find,
  cloneDeep
} from 'lodash';
import PropTypes from 'prop-types';
import {
  TextLink,
  TextField,
  Textarea,
  Notification,
  Heading,
  CheckboxField,
  Paragraph,
  Note
} from '@contentful/forma-36-react-components';
import RolesWorkbenchShell from '../routes/RolesWorkbenchShell';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import FormSection from 'components/forms/FormSection';
import RuleList from './RuleList';
import TranslatorRoleSelector from './TranslatorRoleSelector';
import getLocales from 'access_control/getLocales';
import * as PolicyBuilder from 'access_control/PolicyBuilder';
import * as logger from 'services/logger';
import TheLocaleStore from 'services/localeStore';
import * as Navigator from 'states/Navigator';

import * as RoleListHandler from 'access_control/RoleListHandler';
import RoleEditorSidebar from './RoleEditorSidebar';
import RoleEditorActions from './RoleEditorActions';
import { createRoleRemover } from 'access_control/RoleRemover';
import DocumentTitle from 'components/shared/DocumentTitle';

const PermissionPropType = PropTypes.shape({
  manage: PropTypes.bool,
  read: PropTypes.bool
});

const autofixPolicies = (internal, contentTypes) => {
  const locales = getLocales(TheLocaleStore.getPrivateLocales());
  const internalCopy = cloneDeep(internal);
  const autofixed = PolicyBuilder.removeOutdatedRules(internalCopy, contentTypes, locales);
  if (autofixed) {
    return internalCopy;
  }
  return null;
};

class RoleEditor extends React.Component {
  static propTypes = {
    role: PropTypes.shape({
      name: PropTypes.string,
      description: PropTypes.string,
      permissions: PropTypes.objectOf(PermissionPropType),
      policies: PropTypes.array,
      sys: PropTypes.shape()
    }).isRequired,
    baseRole: PropTypes.shape(),
    autofixed: PropTypes.bool,
    contentTypes: PropTypes.array.isRequired,
    isNew: PropTypes.bool.isRequired,
    setDirty: PropTypes.func.isRequired,
    registerSaveAction: PropTypes.func.isRequired,
    roleRepo: PropTypes.object.isRequired,
    canModifyRoles: PropTypes.bool.isRequired,
    hasCustomRolesFeature: PropTypes.bool.isRequired,
    hasEnvironmentAliasesEnabled: PropTypes.bool.isRequired
  };

  constructor(props) {
    super(props);

    const { role, baseRole } = props;

    const isDuplicate = !!baseRole;

    let internal = PolicyBuilder.toInternal(
      isDuplicate
        ? extend({ name: `Duplicate of ${baseRole.name}` }, omit(baseRole, ['name', 'sys']))
        : role
    );

    if (props.hasCustomRolesFeature && props.canModifyRoles) {
      const autofixedInternals = autofixPolicies(internal, props.contentTypes);
      if (autofixedInternals) {
        internal = autofixedInternals;
      }
    }

    this.state = {
      saving: false,
      dirty: isDuplicate,
      internal
    };
  }

  componentDidMount() {
    this.props.setDirty(this.state.dirty);
    this.props.registerSaveAction(this.save);
  }

  setDirty = dirty => {
    this.setState({ dirty });
    this.props.setDirty(dirty);
  };

  delete = () => {
    const { role } = this.props;

    const listHandler = RoleListHandler.create();
    listHandler.reset().then(() => {
      createRoleRemover(listHandler, role).then(removed => {
        if (removed) {
          this.setDirty(false);
          Navigator.go({
            path: '^.list'
          });
        }
      });
    });
  };

  duplicate = () => {
    const { role } = this.props;

    if (get(role, 'sys.id')) {
      Navigator.go({
        path: '^.new',
        params: { baseRoleId: role.sys.id }
      });
    }
  };

  save = (autofix = false) => {
    this.setState({ saving: true });
    const { isNew, baseRole } = this.props;
    const { internal } = this.state;
    const external = PolicyBuilder.toExternal(internal);

    if (!get(external, 'policies', null)) {
      Notification.error('Policies: invalid JSON.');
    }

    const isDuplicate = !!baseRole;
    const method = isNew || isDuplicate ? 'create' : 'save';
    return this.props.roleRepo[method](external)
      .then(this.handleSaveSuccess(autofix), this.handleSaveError)
      .finally(() => this.setState({ saving: false }));
  };

  handleSaveSuccess = autofix => role => {
    const { isNew } = this.props;
    if (autofix) {
      Notification.success('One or more rules referencing deleted data where removed');
    } else {
      Notification.success(`${role.name} role saved successfully`);
    }

    if (isNew) {
      this.setDirty(false);
      return Navigator.go({ path: '^.detail', params: { roleId: role.sys.id } });
    } else {
      const newInternal = PolicyBuilder.toInternal(role);
      this.setState({ internal: newInternal });
      this.setDirty(false);
      return Promise.resolve(role);
    }
  };

  handleSaveError = response => {
    const errors = get(response, 'body.details.errors', []);

    if (includes(['403', '404'], get(response, 'statusCode'))) {
      Notification.error('You have exceeded your plan limits for Custom Roles.');
      return Promise.reject();
    }

    if (isObject(find(errors, { name: 'taken', path: 'name' }))) {
      Notification.error('This role name is already used.');
      return Promise.reject();
    }

    const nameError = find(errors, { name: 'length', path: 'name' });
    const nameValue = isObject(nameError) ? nameError.value : null;

    if (!nameValue) {
      Notification.error('You have to provide a role name.');
    } else if (isString(nameValue) && nameValue.length > 0) {
      Notification.error('The provided role name is too long.');
    } else {
      Notification.error('Error saving role. Please try again.');
      logger.logServerWarn('Error saving role', { errors });
    }

    return Promise.reject();
  };

  updateInternal = updater => {
    const newInternal = updater(this.state.internal);
    this.setState(
      {
        internal: newInternal,
        external: PolicyBuilder.toExternal(newInternal)
      },
      () => {
        this.setDirty(true);
      }
    );
  };

  resetPolicies = () =>
    this.updateInternal(internal =>
      extend(internal, {
        entries: { allowed: [], denied: [] },
        assets: { allowed: [], denied: [] },
        uiCompatible: true
      })
    );

  updateRuleAttribute = entities => (rulesKey, id) => attribute => ({ target: { value } }) => {
    const DEFAULT_FIELD = PolicyBuilder.PolicyBuilderConfig.ALL_FIELDS;
    const DEFAULT_LOCALE = PolicyBuilder.PolicyBuilderConfig.ALL_LOCALES;

    const rules = this.state.internal[entities][rulesKey];
    const index = findIndex({ id }, rules);
    const rule = rules[index];
    let updatedRule = { ...rule, [attribute]: value };
    switch (attribute) {
      case 'action': {
        switch (value) {
          case 'update':
            updatedRule = { ...updatedRule, field: DEFAULT_FIELD, locale: DEFAULT_LOCALE };
            break;
          case 'create':
            updatedRule = { ...updatedRule, scope: 'any', field: null, locale: null };
            break;
          default:
            updatedRule = { ...updatedRule, field: null, locale: null };
        }
        break;
      }
      case 'contentType':
        updatedRule = {
          ...updatedRule,
          field: updatedRule.action === 'update' ? DEFAULT_FIELD : null
        };
        break;
    }
    this.updateInternal(set([entities, rulesKey, index], updatedRule));
  };

  addRule = (entity, entities) => rulesKey => () => {
    const getDefaultRule = PolicyBuilder.DefaultRule.getDefaultRuleGetterFor(entity);
    this.updateInternal(update([entities, rulesKey], (rules = []) => [...rules, getDefaultRule()]));
  };

  removeRule = entities => (rulesKey, id) => () => {
    this.updateInternal(update([entities, rulesKey], remove({ id })));
  };

  updateRoleFromTextInput = property => ({ target: { value } }) => {
    this.updateInternal(set([property].join('.'), value));
  };

  updateRoleFromCheckbox = property => ({ target: { checked } }) => {
    let update = set(property, checked);
    if (property === 'contentDelivery.manage' && checked === true) {
      update = flow(
        update,
        set('contentDelivery.read', true)
      );
    }

    if (property === 'environments.manage' && checked === false) {
      update = flow(
        update,
        set('environmentAliases.manage', false)
      );
    }

    this.updateInternal(update);
  };

  updateLocale = ({ target: { value: newLocale } }) => {
    const mapPolicies = map(policy =>
      policy.action === 'update' ? set('locale', newLocale, policy) : policy
    );
    this.updateInternal(
      flow(
        update('entries.allowed', mapPolicies),
        update('assets.allowed', mapPolicies)
      )
    );
  };

  navigateToList() {
    return Navigator.go({ path: '^.list' });
  }

  render() {
    const {
      role,
      autofixed,
      canModifyRoles,
      hasCustomRolesFeature,
      hasEnvironmentAliasesEnabled
    } = this.props;

    const { saving, internal, isLegacy, dirty } = this.state;

    const showTranslator = startsWith(role.name, 'Translator');

    let title = '';
    if (dirty) {
      title = `${internal.name || 'Untitled'}*`;
    } else {
      title = internal.name || 'Untitled';
    }

    return (
      <>
        <DocumentTitle title={`${title} | Roles`} />
        <RolesWorkbenchShell
          title={title}
          onBack={() => {
            this.navigateToList();
          }}
          sidebar={
            <RoleEditorSidebar hasCustomRolesFeature={hasCustomRolesFeature} isLegacy={isLegacy} />
          }
          actions={
            <RoleEditorActions
              hasCustomRolesFeature={hasCustomRolesFeature}
              canModifyRoles={canModifyRoles}
              showTranslator={showTranslator}
              dirty={dirty}
              saving={saving}
              isLegacy={isLegacy}
              internal={internal}
              onSave={this.save}
              onDuplicate={this.duplicate}
              onDelete={this.delete}
            />
          }>
          {autofixed && (
            <Note noteType="warning" className={css({ marginBottom: tokens.spacingL })}>
              Some rules have been removed because of changes in your content structure. Please
              review your rules and click &quot;Save changes&quot;.
            </Note>
          )}

          <FormSection title="Role details">
            <TextField
              required
              name="nameInput"
              id="opt_name"
              labelText="Name"
              className="role-editor__name-input"
              value={internal.name || ''}
              onChange={this.updateRoleFromTextInput('name')}
              textInputProps={{ disabled: !canModifyRoles }}
            />
            <TextField
              textarea
              name="descriptionInput"
              id="opt_description"
              labelText="Description"
              value={internal.description || ''}
              onChange={this.updateRoleFromTextInput('description')}
              textInputProps={{ disabled: !canModifyRoles }}
            />
            {showTranslator && (
              <TranslatorRoleSelector
                policies={internal}
                hasFeatureEnabled={hasCustomRolesFeature}
                onChange={this.updateLocale}
                privateLocales={TheLocaleStore.getPrivateLocales()}
              />
            )}
          </FormSection>
          {internal.uiCompatible ? (
            <React.Fragment>
              <FormSection title="Content">
                <RuleList
                  rules={internal.entries}
                  onUpdateRuleAttribute={this.updateRuleAttribute('entries')}
                  onAddRule={this.addRule('entry', 'entries')}
                  onRemoveRule={this.removeRule('entries')}
                  entity="entry"
                  isDisabled={!canModifyRoles}
                  privateLocales={TheLocaleStore.getPrivateLocales()}
                  contentTypes={this.props.contentTypes}
                />
              </FormSection>
              <FormSection title="Media">
                <RuleList
                  rules={internal.assets}
                  onUpdateRuleAttribute={this.updateRuleAttribute('assets')}
                  onAddRule={this.addRule('asset', 'assets')}
                  onRemoveRule={this.removeRule('assets')}
                  entity="asset"
                  isDisabled={!canModifyRoles}
                  privateLocales={TheLocaleStore.getPrivateLocales()}
                  contentTypes={this.props.contentTypes}
                />
              </FormSection>
            </React.Fragment>
          ) : (
            <FormSection title="Policies">
              <Heading element="h3">Policies</Heading>
              <Paragraph>
                <span>The policy for this role cannot be represented visually.</span>
                {canModifyRoles && (
                  <span>
                    You can continue to edit the JSON directly, or{' '}
                    <TextLink href="" onClick={this.resetPolicies}>
                      clear the policy
                    </TextLink>{' '}
                    to define policy rules visually.
                  </span>
                )}
              </Paragraph>
              <div className="cfnext-form-option">
                <Textarea
                  className="cfnext-form__input--full-size"
                  disabled={!canModifyRoles}
                  value={internal.policyString || ''}
                  onChange={this.updateRoleFromTextInput('policyString')}
                  rows="10"
                />
              </div>
            </FormSection>
          )}
          <FormSection title="Content model">
            <div className="cfnext-form-option">
              <CheckboxField
                id="opt_content_types_access"
                name="opt_content_types_access"
                labelIsLight
                labelText="Can modify content types"
                helpText="The content type builder is only shown to users who have this permission"
                disabled={!canModifyRoles}
                checked={internal.contentModel.manage}
                onChange={this.updateRoleFromCheckbox('contentModel.manage')}
                type="checkbox"
              />
            </div>
          </FormSection>
          <FormSection title="API keys">
            <div className="cfnext-form-option">
              <CheckboxField
                id="opt_api_keys_view"
                name="opt_api_keys_view"
                labelIsLight
                labelText="Can access existing API keys for this space."
                disabled={!canModifyRoles || internal.contentDelivery.manage}
                checked={internal.contentDelivery.read}
                onChange={this.updateRoleFromCheckbox('contentDelivery.read')}
                type="checkbox"
              />
            </div>
            <div className="cfnext-form-option">
              <CheckboxField
                id="opt_space_settings_edit"
                name="opt_space_settings_edit"
                labelText="Can create and update API keys for this space."
                labelIsLight
                disabled={!canModifyRoles}
                checked={internal.contentDelivery.manage}
                onChange={this.updateRoleFromCheckbox('contentDelivery.manage')}
                type="checkbox"
              />
            </div>
          </FormSection>
          <FormSection title="Environments settings">
            <div className="cfnext-form-option">
              <CheckboxField
                id="opt_manage_environments_access"
                name="opt_manage_environments_access"
                disabled={!canModifyRoles}
                labelText="Can manage and use all environments for this space."
                helpText="Content level permissions only apply to the master environment"
                labelIsLight
                checked={internal.environments.manage}
                onChange={this.updateRoleFromCheckbox('environments.manage')}
                type="checkbox"
              />
            </div>
            {hasEnvironmentAliasesEnabled && (
              <label className="cfnext-form-option">
                <CheckboxField
                  id="opt_manage_environment_aliases_access"
                  name="opt_manage_environment_aliases_access"
                  disabled={!canModifyRoles || !internal.environments.manage}
                  checked={internal.environments.manage && internal.environmentAliases.manage}
                  onChange={this.updateRoleFromCheckbox('environmentAliases.manage')}
                  type="checkbox"
                  labelText="Can create environment aliases and change their target environment for this space."
                  labelIsLight
                />
              </label>
            )}
          </FormSection>
          <FormSection title="Space settings">
            <div className="cfnext-form-option">
              <CheckboxField
                id="opt_space_settings_access"
                name="opt_space_settings_access"
                disabled={!canModifyRoles}
                checked={internal.settings.manage}
                onChange={this.updateRoleFromCheckbox('settings.manage')}
                type="checkbox"
                labelIsLight
                labelText="Can modify space settings."
                helpText="This permission allows users to modify locales, webhooks, apps,
              the space name, and logo image. It does not grant permission to modify the roles or access of a user or team to this space. This
              permission does not allow users to delete the space."
              />
            </div>
          </FormSection>
        </RolesWorkbenchShell>
      </>
    );
  }
}

export default RoleEditor;
