/* eslint-disable rulesdir/restrict-non-f36-components */
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
  Button,
  Notification,
  Heading,
  Checkbox,
  Paragraph
} from '@contentful/forma-36-react-components';
import Workbench from 'app/common/Workbench.es6';
import FormSection from 'components/forms/FormSection.es6';
import * as ResourceUtils from 'utils/ResourceUtils.es6';
import { getModule } from 'NgRegistry.es6';
import RuleList from './RuleList.es6';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase.es6';
import CustomRolesPlanInfo from './CustomRolesPlanInfo.es6';
import TranslatorRoleSelector from './TranslatorRoleSelector.es6';
import RoleEditorButton from './RoleEditorButton.es6';
import Icon from '../ui/Components/Icon.es6';
import getLocales from './getLocales.es6';
import * as PolicyBuilder from 'access_control/PolicyBuilder/index.es6';
import * as logger from 'services/logger.es6';
import createLegacyFeatureService from 'services/LegacyFeatureService.es6';
import { getSubscriptionState } from 'account/AccountUtils.es6';
import TheLocaleStore from 'services/localeStore.es6';
import { getSpaceFeature } from 'data/CMA/ProductCatalog.es6';
import { ENVIRONMENT_ALIASING } from '../featureFlags.es6';

import * as createResourceService from 'services/ResourceService.es6';
import * as RoleRepository from 'access_control/RoleRepository.es6';

import * as RoleListHandler from './RoleListHandler.es6';

const PermissionPropType = PropTypes.shape({
  manage: PropTypes.bool,
  read: PropTypes.bool
});

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
    isNew: PropTypes.bool.isRequired,
    setDirty: PropTypes.func.isRequired,
    registerSaveAction: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    const { role, baseRole, registerSaveAction, setDirty } = props;

    const isDuplicate = !!baseRole;
    const internal = PolicyBuilder.toInternal(
      isDuplicate
        ? extend({ name: `Duplicate of ${baseRole.name}` }, omit(baseRole, ['name', 'sys']))
        : role
    );

    this.state = {
      canModifyRoles: undefined,
      hasCustomRolesFeature: undefined,
      hasEnvironmentAliasesEnabled: undefined,
      loading: undefined,
      saving: false,
      accountUpgradeState: getSubscriptionState(),
      dirty: isDuplicate,
      internal
    };
    setDirty(this.state.dirty);
    registerSaveAction(this.save);
  }

  setDirty = dirty => {
    const { internal } = this.state;

    this.setState({ dirty });
    this.props.setDirty(dirty);
    if (dirty) {
      document.title = `${internal.name || 'Untitled'}*`;
    } else {
      document.title = internal.name || 'Untitled';
    }
  };

  delete = () => {
    const $state = getModule('$state');
    const createRoleRemover = getModule('createRoleRemover');

    const { role } = this.props;

    const listHandler = RoleListHandler.create();
    listHandler.reset().then(() => {
      createRoleRemover(listHandler, () => {
        this.setDirty(false);
        $state.go('^.list');
      })(role);
    });
  };

  duplicate = () => {
    const $state = getModule('$state');

    const { role } = this.props;

    if (get(role, 'sys.id')) {
      $state.go('^.new', { baseRoleId: role.sys.id });
    }
  };

  save = (autofix = false) => {
    const spaceContext = getModule('spaceContext');

    this.setState({ saving: true });
    const { isNew, baseRole } = this.props;
    const { internal } = this.state;
    const external = PolicyBuilder.toExternal(internal);

    if (!get(external, 'policies', null)) {
      Notification.error('Policies: invalid JSON.');
    }

    const roleRepo = RoleRepository.getInstance(spaceContext.space);
    const isDuplicate = !!baseRole;
    const method = isNew || isDuplicate ? 'create' : 'save';
    return roleRepo[method](external)
      .then(this.handleSaveSuccess(autofix), this.handleSaveError)
      .finally(() => this.setState({ saving: false }));
  };

  handleSaveSuccess = autofix => role => {
    const $state = getModule('$state');

    const { isNew } = this.props;
    if (autofix) {
      Notification.success('One or more rules referencing deleted data where removed');
    } else {
      Notification.success(`${role.name} role saved successfully`);
    }

    if (isNew) {
      this.setDirty(false);
      return $state.go('^.detail', { roleId: role.sys.id });
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

  autofixPolicies = () => {
    const spaceContext = getModule('spaceContext');

    const cts = spaceContext.publishedCTs.getAllBare();
    const locales = getLocales(TheLocaleStore.getPrivateLocales());
    const internalCopy = cloneDeep(this.state.internal);
    const autofixed = PolicyBuilder.removeOutdatedRules(internalCopy, cts, locales);
    if (autofixed) {
      return internalCopy;
    }
    return null;
  };

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

  async componentDidMount() {
    const spaceContext = getModule('spaceContext');

    const { isNew } = this.props;
    const organization = spaceContext.organization;
    const FeatureService = createLegacyFeatureService(spaceContext.getId());

    this.setState({ loading: true });

    const [hasEnvironmentAliasesEnabled, featureEnabled, resource] = await Promise.all([
      getSpaceFeature(spaceContext.space.getId(), ENVIRONMENT_ALIASING),
      FeatureService.get('customRoles'),
      createResourceService.default(spaceContext.getId()).get('role')
    ]);

    const stateUpdates = [];
    stateUpdates.push(set('hasEnvironmentAliasesEnabled', hasEnvironmentAliasesEnabled));
    stateUpdates.push(set('isLegacy', ResourceUtils.isLegacyOrganization(organization)));
    let autofixedInternals = null;

    if (!featureEnabled) {
      stateUpdates.push(set('hasCustomRolesFeature', false), set('canModifyRoles', false));
    } else if (isNew && !ResourceUtils.canCreate(resource)) {
      Notification.error('Your organization has reached the limit for custom roles.');
      stateUpdates.push(set('hasCustomRolesFeature', true), set('canModifyRoles', false));
    } else {
      stateUpdates.push(set('hasCustomRolesFeature', true), set('canModifyRoles', true));
      autofixedInternals = this.autofixPolicies();
      if (autofixedInternals) {
        stateUpdates.push(set('internal', autofixedInternals));
      }
    }
    stateUpdates.push(set('loading', false));

    this.setState(flow(...stateUpdates), () => autofixedInternals !== null && this.save(true));
  }

  navigateToList() {
    const $state = getModule('$state');

    return $state.go('^.list');
  }

  render() {
    const spaceContext = getModule('spaceContext');

    const { role, autofixed } = this.props;

    const {
      canModifyRoles,
      hasCustomRolesFeature,
      hasEnvironmentAliasesEnabled,
      loading,
      saving,
      internal,
      isLegacy,
      dirty
    } = this.state;

    const showTranslator = startsWith(role.name, 'Translator');

    return (
      <React.Fragment>
        <Workbench className="role-editor">
          <Workbench.Header>
            <div className="breadcrumbs-widget">
              <div className="breadcrumbs-container">
                <div
                  data-test-id="roles-back"
                  className="btn btn__back"
                  onClick={() => this.navigateToList()}>
                  <Icon name="back" />
                </div>
              </div>
            </div>
            <Workbench.Icon icon="page-settings" />
            <Workbench.Title>{internal.name}</Workbench.Title>
          </Workbench.Header>
          <Workbench.Content>
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
                    contentTypes={spaceContext.publishedCTs.getAllBare()}
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
                    contentTypes={spaceContext.publishedCTs.getAllBare()}
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
                <Checkbox
                  id="opt_content_types_access"
                  disabled={!canModifyRoles}
                  checked={internal.contentModel.manage}
                  onChange={this.updateRoleFromCheckbox('contentModel.manage')}
                  type="checkbox"
                />
                <label htmlFor="opt_content_types_access">
                  Can modify content types
                  <em>
                    {' '}
                    (the content type builder is only shown to users who have this permission)
                  </em>
                  .
                </label>
              </div>
            </FormSection>
            <FormSection title="API keys">
              <div className="cfnext-form-option">
                <Checkbox
                  id="opt_api_keys_view"
                  disabled={!canModifyRoles || internal.contentDelivery.manage}
                  checked={internal.contentDelivery.read}
                  onChange={this.updateRoleFromCheckbox('contentDelivery.read')}
                  type="checkbox"
                />
                <label htmlFor="opt_api_keys_view">
                  Can access existing API keys for this space.
                </label>
              </div>
              <div className="cfnext-form-option">
                <Checkbox
                  id="opt_space_settings_edit"
                  disabled={!canModifyRoles}
                  checked={internal.contentDelivery.manage}
                  onChange={this.updateRoleFromCheckbox('contentDelivery.manage')}
                  type="checkbox"
                />
                <label htmlFor="opt_space_settings_edit">
                  Can create and update API keys for this space.
                </label>
              </div>
            </FormSection>
            <FormSection title="Environments settings">
              <div className="cfnext-form-option">
                <Checkbox
                  id="opt_manage_environments_access"
                  disabled={!canModifyRoles}
                  checked={internal.environments.manage}
                  onChange={this.updateRoleFromCheckbox('environments.manage')}
                  type="checkbox"
                />
                <label htmlFor="opt_manage_environments_access">
                  Can manage and use all environments for this space.
                  <em> (Content level permissions only apply to the master environment)</em>.
                </label>
              </div>
              {hasEnvironmentAliasesEnabled && (
                <label className="cfnext-form-option">
                  <Checkbox
                    id="opt_manage_environment_aliases_access"
                    disabled={!canModifyRoles || !internal.environments.manage}
                    checked={internal.environments.manage && internal.environmentAliases.manage}
                    onChange={this.updateRoleFromCheckbox('environmentAliases.manage')}
                    type="checkbox"
                  />
                  <label htmlFor="opt_manage_environment_aliases_access">
                    Can create environment aliases and change their target environment for this
                    space.
                  </label>
                </label>
              )}
            </FormSection>
            <FormSection title="Space settings">
              <div className="cfnext-form-option">
                <Checkbox
                  id="opt_space_settings_access"
                  disabled={!canModifyRoles}
                  checked={internal.settings.manage}
                  onChange={this.updateRoleFromCheckbox('settings.manage')}
                  type="checkbox"
                />
                <label htmlFor="opt_space_settings_access">
                  Can modify space settings. This permission allows users to modify locales,
                  webhooks, the space name, and logo image. It does
                  <strong> not </strong>
                  grant permission to modify the roles or access of a user or team to this space.
                  This permission does not allow users to delete the space.
                </label>
              </div>
            </FormSection>
          </Workbench.Content>
          <Workbench.Sidebar>
            {!loading && !hasCustomRolesFeature && !canModifyRoles && (
              <div className="entity-sidebar">
                <Heading element="h2" className="entity-sidebar__heading">
                  Role
                </Heading>
                <div className="entity-sidebar__state-select">
                  {showTranslator && (
                    <Button
                      testId="save-button"
                      disabled={!dirty}
                      loading={saving}
                      onClick={() => this.save()}>
                      Save changes
                    </Button>
                  )}
                </div>
                {!showTranslator && (
                  <Paragraph>
                    This role can‘t be customized because your plan does not include custom roles.
                  </Paragraph>
                )}
                <CustomRolesPlanInfo isLegacy={isLegacy} />
              </div>
            )}
            {hasCustomRolesFeature && canModifyRoles && (
              <div className="entity-sidebar">
                <div className="entity-sidebar__state-select">
                  <RoleEditorButton
                    onSave={() => this.save()}
                    onDuplicate={this.duplicate}
                    onDelete={this.delete}
                    disabled={!dirty}
                    loading={saving}
                    showDropdown={internal.id && canModifyRoles}
                  />
                </div>
                {autofixed && (
                  <div className="rule-list__note note-box note-box--info">
                    <span>
                      Some rules have been removed because of changes in your content structure.
                      Please review your rules and click &quot;Save changes&quot;.
                    </span>
                  </div>
                )}
                <Heading element="h2" className="entity-sidebar__heading">
                  Learn more
                </Heading>
                <Paragraph>
                  To create or customize a role, such as a translator for a specific language, read
                  the documentation on{' '}
                  <KnowledgeBase
                    target="roles"
                    text="custom roles and permissions"
                    inlineText
                    icon={false}
                  />
                  .
                </Paragraph>
                <Heading element="h2" className="entity-sidebar__heading">
                  Hint from our staff
                </Heading>
                <div className="staff-hint">
                  <i className="fa fa-quote-left" />
                  <div className="staff-hint__quote">
                    <div className="staff-hint__content">
                      Anything that is not explicitly allowed, is&nbsp;denied.
                    </div>
                    <div className="staff-hint__author">
                      <div className="staff-hint__author-photo" />
                      <div className="staff-hint__authr-name">
                        <strong>Hervé Labas</strong>
                        <Paragraph>Group Product manager at Contentful</Paragraph>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Workbench.Sidebar>
        </Workbench>
      </React.Fragment>
    );
  }
}

export default RoleEditor;
