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
  cloneDeep,
  identity
} from 'lodash';
import PropTypes from 'prop-types';
import { TextField, Button, Notification } from '@contentful/forma-36-react-components';
import Workbench from 'app/common/Workbench.es6';
import FormSection from 'components/forms/FormSection.es6';
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

const $state = getModule('$state');
const spaceContext = getModule('spaceContext');
const createRoleRemover = getModule('createRoleRemover');
const TheAccountView = getModule('TheAccountView');
const UserListHandler = getModule('UserListHandler');
const RoleRepository = getModule('access_control/RoleRepository.es6');
const createFeatureService = getModule('services/FeatureService.es6');
const createResourceService = getModule('services/ResourceService.es6');
const ResourceUtils = getModule('utils/ResourceUtils.es6');

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
      loading: undefined,
      saving: false,
      accountUpgradeState: TheAccountView.getSubscriptionState(),
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
    const { role } = this.props;

    const listHandler = UserListHandler.create();
    listHandler.reset().then(() => {
      createRoleRemover(listHandler, () => {
        this.setDirty(false);
        $state.go('^.list');
      })(role);
    });
  };

  duplicate = () => {
    const { role } = this.props;

    if (get(role, 'sys.id')) {
      $state.go('^.new', { baseRoleId: role.sys.id });
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

    const roleRepo = RoleRepository.getInstance(spaceContext.space);
    const isDuplicate = !!baseRole;
    const method = isNew || isDuplicate ? 'create' : 'save';
    return roleRepo[method](external)
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
    const cts = spaceContext.publishedCTs.getAllBare();
    const locales = getLocales();
    const internalCopy = cloneDeep(this.state.internal);
    const autofixed = PolicyBuilder.removeOutdatedRules(internalCopy, cts, locales);
    if (autofixed) {
      this.save(true);
      return set('internal', internalCopy);
    }
    return identity;
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
    const { isNew } = this.props;
    const organization = spaceContext.organization;
    const FeatureService = createFeatureService.default(spaceContext.getId());

    this.setState({ loading: true });

    const [featureEnabled, resource, useLegacy] = await Promise.all([
      FeatureService.get('customRoles'),
      createResourceService.default(spaceContext.getId()).get('role'),
      ResourceUtils.useLegacy(organization)
    ]);

    const stateUpdates = [];
    stateUpdates.push(set('isLegacy', useLegacy));

    if (!featureEnabled) {
      stateUpdates.push(set('hasCustomRolesFeature', false), set('canModifyRoles', false));
    } else if (isNew && !ResourceUtils.canCreate(resource)) {
      Notification.error('Your organization has reached the limit for custom roles.');
      stateUpdates.push(set('hasCustomRolesFeature', true), set('canModifyRoles', false));
    } else {
      stateUpdates.push(set('hasCustomRolesFeature', true), set('canModifyRoles', true));
      stateUpdates.push(this.autofixPolicies());
    }
    stateUpdates.push(set('loading', false));

    this.setState(flow(...stateUpdates));
  }

  navigateToList() {
    return $state.go('^.list');
  }

  render() {
    const { role, autofixed } = this.props;

    const {
      canModifyRoles,
      hasCustomRolesFeature,
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
                extraClassNames="role-editor__name-input"
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
                  />
                </FormSection>
              </React.Fragment>
            ) : (
              <FormSection title="Policies">
                <h3>Policies</h3>
                <p>
                  <span>The policy for this role cannot be represented visually.</span>
                  {canModifyRoles && (
                    <span>
                      You can continue to edit the JSON directly, or{' '}
                      <a href="" onClick={this.resetPolicies}>
                        clear the policy
                      </a>{' '}
                      to define policy rules visually.
                    </span>
                  )}
                </p>
                <div className="cfnext-form-option">
                  <textarea
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
                <input
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
                <input
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
                <input
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
            <FormSection title="Sandbox environments settings">
              <div className="cfnext-form-option">
                <input
                  id="opt_manage_environments_access"
                  disabled={!canModifyRoles}
                  checked={internal.environments.manage}
                  onChange={this.updateRoleFromCheckbox('environments.manage')}
                  type="checkbox"
                />
                <label htmlFor="opt_manage_environments_access">
                  Can manage and use all sandbox environments in this space.
                  <em> (Content level permissions do not apply in a sandbox environment)</em>.
                </label>
              </div>
            </FormSection>
            <FormSection title="Space settings">
              <div className="cfnext-form-option">
                <input
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
                  grant permission to update users roles or delete the space.
                </label>
              </div>
            </FormSection>
          </Workbench.Content>
          <Workbench.Sidebar>
            {!loading && !hasCustomRolesFeature && !canModifyRoles && (
              <div className="entity-sidebar">
                <h2 className="entity-sidebar__heading">Role</h2>
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
                  <p>
                    This role can‘t be customized because your plan does not include custom roles.
                  </p>
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
                <h2 className="entity-sidebar__heading">Learn more</h2>
                <p>
                  To create or customize a role, such as a translator for a specific language, read
                  the documentation on{' '}
                  <KnowledgeBase
                    target="roles"
                    text="custom roles and permissions"
                    inlineText
                    icon={false}
                  />
                  .
                </p>
                <h2 className="entity-sidebar__heading">Hint from our staff</h2>
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
                        <p>Group Product manager at Contentful</p>
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
