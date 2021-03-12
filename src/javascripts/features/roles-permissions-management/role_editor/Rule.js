import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { get } from 'lodash';
import { css } from 'emotion';
import { getLocales } from '../utils/getLocales';
import tokens from '@contentful/forma-36-tokens';
import {
  Button,
  Option,
  Select,
  Tag,
  ValidationMessage,
} from '@contentful/forma-36-react-components';
import { PolicyBuilderConfig, MISSING_ATTRIBUTES } from 'access_control/PolicyBuilder';
import { truncate } from 'utils/StringUtils';
import { RuleTagsSelection } from 'features/roles-permissions-management/components/RuleTagsSelection';
import { getEntityName } from './RuleList';

const { TAGS, NO_PATH_CONSTRAINT } = PolicyBuilderConfig;

export const contentTypesToOptions = (contentTypes) =>
  [
    {
      id: PolicyBuilderConfig.ALL_CTS,
      name: 'All content types',
    },
  ].concat(contentTypes.map(({ sys: { id }, name }) => ({ id, name })));

const contentTypeFieldsToOptions = (contentTypes) =>
  [
    {
      id: PolicyBuilderConfig.NO_PATH_CONSTRAINT,
      name: 'All fields and tags',
    },
    {
      id: PolicyBuilderConfig.ALL_FIELDS,
      name: 'All fields',
    },
    {
      id: PolicyBuilderConfig.TAGS,
      name: 'Tags',
    },
  ].concat(
    get(contentTypes, ['fields'], []).map(({ id, name, apiName }) => ({
      id: apiName || id,
      name: `${name} (field)`,
    }))
  );

const entityScopeToOptions = (entityName) => [
  { id: 'any', name: `Any ${entityName[0].toLowerCase()}` },
  { id: 'user', name: `${entityName[1]} created by user` },
  { id: 'entityId', name: `A specific ${entityName[0].toLowerCase()}` },
];

const assetOptions = [
  {
    id: PolicyBuilderConfig.NO_PATH_CONSTRAINT,
    name: 'All fields and tags',
  },
  {
    id: PolicyBuilderConfig.ALL_FIELDS,
    name: 'All fields',
  },
  {
    id: PolicyBuilderConfig.TAGS,
    name: 'Tags',
  },
];

export const actionsOptions = [
  {
    value: 'all',
    text: 'All actions',
  },
  {
    value: 'read',
    text: 'Read',
  },
  {
    value: 'update',
    text: 'Edit',
  },
  {
    value: 'create',
    text: 'Create',
  },
  {
    value: 'delete',
    text: 'Delete',
  },
  {
    value: 'archive',
    text: 'Archive/Unarchive',
  },
  {
    value: 'publish',
    text: 'Publish/Unpublish',
  },
];

const missingAttributeLabels = {
  [MISSING_ATTRIBUTES.contentType]: 'content type',
  [MISSING_ATTRIBUTES.field]: 'field',
  [MISSING_ATTRIBUTES.entry]: 'entry',
  [MISSING_ATTRIBUTES.asset]: 'asset',
  [MISSING_ATTRIBUTES.locale]: 'locale',
  [MISSING_ATTRIBUTES.tags]: 'tag(s)',
};

const listMissingAttributes = (missing) =>
  `Missing ${missing
    .map((attribute) => missingAttributeLabels[attribute])
    .join(', ')
    .replace(/,(?!.*,)/gim, ' and')}`;

const styles = {
  rule: css({
    margin: `${tokens.spacingM} 0`,
  }),
  ruleList: css({
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
  }),
  select: css({
    marginRight: tokens.spacingS,
    marginTop: tokens.spacingXs,
    marginBottom: tokens.spacingXs,
  }),
  selectErrored: css({
    '& > select': css({
      '&:active': css({
        borderColor: tokens.colorRedLight,
      }),
    }),
  }),
  ruleLabel: css({
    marginRight: tokens.spacingM,
  }),
  ruleLabelWithIcon: css({
    marginRight: tokens.spacingXs,
  }),
};

export class Rule extends React.Component {
  static propTypes = {
    isDisabled: PropTypes.bool,
    rule: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      contentType: PropTypes.string,
      action: PropTypes.string,
      scope: PropTypes.string,
      entityId: PropTypes.string,
      field: PropTypes.string,
      locale: PropTypes.string,
      metadataTagIds: PropTypes.arrayOf(PropTypes.string),
    }),
    entity: PropTypes.string,
    onRemove: PropTypes.func.isRequired,
    onUpdateAttribute: PropTypes.func.isRequired,
    privateLocales: PropTypes.array.isRequired,
    contentTypes: PropTypes.array.isRequired,
    searchEntities: PropTypes.func.isRequired,
    getEntityTitle: PropTypes.func.isRequired,
    hasClpFeature: PropTypes.bool,
    focus: PropTypes.bool,
    modified: PropTypes.bool.isRequired,
    isNew: PropTypes.bool.isRequired,
    missing: PropTypes.array.isRequired,
  };

  state = {
    ref: React.createRef(),
  };

  constructor(props) {
    super(props);
    this.contentTypes = contentTypesToOptions(props.contentTypes);
    this.state.entities = {};
  }

  static getDerivedStateFromProps(props) {
    const { rule, contentTypes } = props;

    const ct = contentTypes.find((ct) => ct.sys.id === rule.contentType);
    return {
      contentTypeFields: contentTypeFieldsToOptions(ct),
    };
  }

  searchEntitiesAndUpdate = () => {
    const { entity, searchEntities, onUpdateAttribute, rule } = this.props;
    const entityName = getEntityName(entity);

    return searchEntities(entityName[0]).then((entity) => {
      if (entity) {
        if (entityName[0] === 'Entry') {
          onUpdateAttribute(
            'contentType',
            rule.contentType
          )({
            target: { value: entity.sys.contentType.sys.id },
          });
        }
        onUpdateAttribute('entityId', rule.entityId)({ target: { value: entity.sys.id } });
        return entity.sys.id;
      }
      return null;
    });
  };

  updateScope = (event) => {
    const { rule, onUpdateAttribute } = this.props;
    if (event.target.value === 'entityId' && !rule.entityId) {
      return this.searchEntitiesAndUpdate().then((entityId) => {
        if (entityId) {
          return onUpdateAttribute('scope', rule.scope)({ target: { value: 'entityId' } });
        }
        return null;
      });
    }
    return onUpdateAttribute('scope', rule.scope)(event);
  };

  entityIsMissing = (missing) =>
    [MISSING_ATTRIBUTES.entry, MISSING_ATTRIBUTES.asset].some((el) => missing.includes(el));

  getEntityLabel = (isIncomplete) => {
    const { missing, entity, getEntityTitle, rule } = this.props;
    if (isIncomplete && this.entityIsMissing(missing)) {
      return `Missing ${entity}`;
    } else {
      return truncate(getEntityTitle(rule.entityId, rule.contentType), 50);
    }
  };

  render() {
    const {
      isDisabled,
      entity,
      onRemove,
      onUpdateAttribute,
      rule,
      privateLocales,
      focus,
      isNew,
      modified,
      missing,
    } = this.props;
    const entityName = getEntityName(entity);
    const isIncomplete = missing.length > 0;

    if (focus && this.state.ref.current) {
      this.state.ref.current.scrollIntoView({ behaviour: 'smooth', block: 'center' });
      const firstSelectComponent = this.state.ref.current.children[1];
      firstSelectComponent?.firstElementChild?.focus();
    }

    return (
      <div className={styles.rule}>
        <div ref={this.state.ref} className={styles.ruleList} data-test-id="rule-item">
          {!isNew && modified && (
            <Tag tagType="warning" className={styles.ruleLabel}>
              Edited
            </Tag>
          )}
          {isNew && (
            <Tag testId="new-rule-indicator" tagType="primary" className={styles.ruleLabel}>
              New
            </Tag>
          )}
          <SelectField
            testId="action"
            label="action"
            isDisabled={isDisabled}
            ruleIsIncomplete={isIncomplete}
            fieldIsIncomplete={false}
            value={rule.action}
            onChange={onUpdateAttribute('action', rule.action)}
            options={actionsOptions.map(({ value, text }) => ({ id: value, name: text }))}
          />
          <SelectField
            testId="scope"
            label="scope"
            isDisabled={rule.action === 'create' || isDisabled}
            ruleIsIncomplete={isIncomplete}
            fieldIsIncomplete={false}
            attachedFieldIsIncomplete={isIncomplete && this.entityIsMissing(missing)}
            value={rule.scope}
            onChange={this.updateScope}
            options={entityScopeToOptions(entityName)}
          />
          {rule.scope === 'entityId' && (
            <Button
              onClick={this.searchEntitiesAndUpdate}
              className={styles.select}
              buttonType={isIncomplete ? 'negative' : 'primary'}
              disabled={isIncomplete}>
              {this.getEntityLabel(isIncomplete)}
            </Button>
          )}
          {entity === 'entry' && (
            <React.Fragment>
              <SelectField
                testId="contentType"
                label="content type"
                isDisabled={rule.scope === 'entityId' || isDisabled}
                ruleIsIncomplete={isIncomplete}
                fieldIsIncomplete={isIncomplete && missing.includes(MISSING_ATTRIBUTES.contentType)}
                value={rule.contentType}
                onChange={onUpdateAttribute('contentType', rule.contentType)}
                options={this.contentTypes}
              />
              {rule.action === 'update' && (
                <SelectField
                  testId="field"
                  label="field"
                  isDisabled={rule.contentType === 'all' || isDisabled}
                  ruleIsIncomplete={isIncomplete}
                  fieldIsIncomplete={isIncomplete && missing.includes(MISSING_ATTRIBUTES.field)}
                  value={rule.field}
                  onChange={onUpdateAttribute('field', rule.field)}
                  options={this.state.contentTypeFields}
                />
              )}
            </React.Fragment>
          )}
          {entity === 'asset' && rule.action === 'update' && (
            <SelectField
              testId="asset_field"
              label="field"
              isDisabled={isDisabled}
              ruleIsIncomplete={isIncomplete}
              fieldIsIncomplete={false}
              value={rule.field}
              onChange={onUpdateAttribute('field', rule.field)}
              options={assetOptions}
            />
          )}
          {rule.action === 'update' && (
            <SelectField
              testId="locale"
              label="locale"
              isDisabled={isDisabled || rule.field === TAGS || rule.field === NO_PATH_CONSTRAINT}
              ruleIsIncomplete={isIncomplete}
              fieldIsIncomplete={isIncomplete && missing.includes(MISSING_ATTRIBUTES.locale)}
              value={rule.locale}
              onChange={onUpdateAttribute('locale', rule.locale)}
              options={getLocales(privateLocales).map(({ code, name }) => ({ id: code, name }))}
            />
          )}
          {this.props.hasClpFeature && !['all', 'create'].includes(rule.action) && (
            <RuleTagsSelection
              rule={rule}
              onChange={onUpdateAttribute('metadataTagIds', rule.metadataTagIds)}
              isDisabled={isDisabled}
              ruleIsIncomplete={isIncomplete}
              fieldIsIncomplete={isIncomplete && missing.includes(MISSING_ATTRIBUTES.tags)}
            />
          )}
          {!isDisabled && (
            <Button onClick={onRemove} buttonType="naked" icon="Delete">
              Delete rule
            </Button>
          )}
        </div>
        {isIncomplete && <ValidationMessage>{listMissingAttributes(missing)}</ValidationMessage>}
      </div>
    );
  }
}

const SelectField = (props) => {
  const {
    label,
    options,
    isDisabled,
    ruleIsIncomplete,
    fieldIsIncomplete,
    attachedFieldIsIncomplete = false,
    ...rest
  } = props;
  return (
    <Select
      className={classNames({
        [styles.select]: true,
        [styles.selectErrored]: fieldIsIncomplete || attachedFieldIsIncomplete,
      })}
      width="medium"
      isDisabled={isDisabled || ruleIsIncomplete}
      hasError={fieldIsIncomplete || attachedFieldIsIncomplete}
      {...rest}>
      {fieldIsIncomplete ? (
        <Option value="missing">{`Missing ${label}`}</Option>
      ) : (
        options.map(({ id, name }) => (
          <Option value={id} key={id}>
            {name}
          </Option>
        ))
      )}
    </Select>
  );
};

SelectField.propTypes = {
  label: PropTypes.string.isRequired,
  isDisabled: PropTypes.bool.isRequired,
  ruleIsIncomplete: PropTypes.bool.isRequired,
  fieldIsIncomplete: PropTypes.bool.isRequired,
  attachedFieldIsIncomplete: PropTypes.bool,
  options: PropTypes.array.isRequired,
};
