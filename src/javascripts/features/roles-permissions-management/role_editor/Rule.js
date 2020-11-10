import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { css } from 'emotion';
import { getLocales } from '../utils/getLocales';
import tokens from '@contentful/forma-36-tokens';
import { Select, Option, Button } from '@contentful/forma-36-react-components';
import { PolicyBuilderConfig } from 'access_control/PolicyBuilder';
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

const styles = {
  ruleList: css({
    display: 'flex',
    margin: `${tokens.spacingM} 0`,
    alignItems: 'center',
    flexWrap: 'wrap',
  }),
  select: css({
    marginRight: tokens.spacingS,
    marginTop: tokens.spacingXs,
    marginBottom: tokens.spacingXs,
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
    }),
    entity: PropTypes.string,
    onRemove: PropTypes.func.isRequired,
    onUpdateAttribute: PropTypes.func.isRequired,
    privateLocales: PropTypes.array.isRequired,
    contentTypes: PropTypes.array.isRequired,
    searchEntities: PropTypes.func.isRequired,
    getEntityTitle: PropTypes.func.isRequired,
    hasClpFeature: PropTypes.bool,
  };

  state = {};

  constructor(props) {
    super(props);
    this.contentTypes = contentTypesToOptions(props.contentTypes);
    this.state.entities = {};
  }

  static getDerivedStateFromProps(props) {
    const { rule, contentTypes } = props;

    const ct = contentTypes.find((ct) => ct.sys.id === rule.contentType);
    return {
      contentTypeFields: [
        {
          id: PolicyBuilderConfig.NO_PATH_CONSTRAINT,
          name: 'All fields and tags (metadata)',
        },
        {
          id: PolicyBuilderConfig.ALL_FIELDS,
          name: 'All fields',
        },
      ].concat(
        get(ct, ['fields'], []).map(({ id, name, apiName }) => ({
          id: apiName || id,
          name,
        })),
        {
          id: PolicyBuilderConfig.TAGS,
          name: 'Tags (metadata)',
        }
      ),
      assetFields: [
        {
          id: PolicyBuilderConfig.NO_PATH_CONSTRAINT,
          name: 'All fields and tags (metadata)',
        },
        {
          id: PolicyBuilderConfig.ALL_FIELDS,
          name: 'All fields',
        },
        {
          id: PolicyBuilderConfig.TAGS,
          name: 'Tags (metadata)',
        },
      ],
    };
  }

  searchEntitiesAndUpdate = () => {
    const { entity, searchEntities, onUpdateAttribute } = this.props;
    const entityName = getEntityName(entity);

    return searchEntities(entityName[0]).then((entity) => {
      if (entity) {
        if (entityName[0] === 'Entry') {
          onUpdateAttribute('contentType')({
            target: { value: entity.sys.contentType.sys.id },
          });
        }
        onUpdateAttribute('entityId')({ target: { value: entity.sys.id } });
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
          return onUpdateAttribute('scope')({ target: { value: 'entityId' } });
        }
        return null;
      });
    }
    return onUpdateAttribute('scope')(event);
  };

  render() {
    const {
      isDisabled,
      entity,
      onRemove,
      onUpdateAttribute,
      rule,
      privateLocales,
      getEntityTitle,
    } = this.props;
    const entityName = getEntityName(entity);
    return (
      <div className={styles.ruleList} data-test-id="rule-item">
        <Select
          className={styles.select}
          width="medium"
          testId="action"
          isDisabled={isDisabled}
          value={rule.action}
          onChange={onUpdateAttribute('action')}>
          {actionsOptions.map(({ value, text }) => {
            return (
              <Option key={value} value={value}>
                {text}
              </Option>
            );
          })}
        </Select>
        <Select
          className={styles.select}
          width="medium"
          testId="scope"
          isDisabled={rule.action === 'create' || isDisabled}
          value={rule.scope}
          onChange={this.updateScope}>
          <Option value="any">{`Any ${entityName[0].toLowerCase()}`}</Option>
          <Option value="user">{`${entityName[1]} created by user`}</Option>
          <Option value="entityId">{`A specific ${entityName[0].toLowerCase()}`}</Option>
        </Select>
        {rule.scope === 'entityId' && (
          <Button onClick={this.searchEntitiesAndUpdate} className={styles.select}>
            {truncate(getEntityTitle(rule.entityId, rule.contentType), 50)}
          </Button>
        )}
        {entity === 'entry' && (
          <React.Fragment>
            <Select
              className={styles.select}
              width="medium"
              testId="contentType"
              isDisabled={rule.scope === 'entityId' || isDisabled}
              value={rule.contentType}
              onChange={onUpdateAttribute('contentType')}>
              {this.contentTypes.map(({ id, name }) => (
                <Option value={id} key={id}>
                  {name}
                </Option>
              ))}
            </Select>
            {rule.action === 'update' && (
              <Select
                className={styles.select}
                width="medium"
                testId="field"
                isDisabled={rule.contentType === 'all' || isDisabled}
                value={rule.field}
                onChange={onUpdateAttribute('field')}>
                {this.state.contentTypeFields.map(({ id, name }) => (
                  <Option value={id} key={id}>
                    {name}
                  </Option>
                ))}
              </Select>
            )}
          </React.Fragment>
        )}
        {entity === 'asset' && rule.action === 'update' && (
          <Select
            className={styles.select}
            width="medium"
            testId="asset_field"
            isDisabled={isDisabled}
            value={rule.field}
            onChange={onUpdateAttribute('field')}>
            {this.state.assetFields.map(({ id, name }) => (
              <Option value={id} key={id}>
                {name}
              </Option>
            ))}
          </Select>
        )}
        {rule.action === 'update' && (
          <Select
            className={styles.select}
            width="medium"
            testId="locale"
            isDisabled={isDisabled || rule.field === TAGS || rule.field === NO_PATH_CONSTRAINT}
            value={rule.locale}
            onChange={onUpdateAttribute('locale')}>
            {getLocales(privateLocales).map(({ code, name }) => (
              <Option value={code} key={code}>
                {name}
              </Option>
            ))}
          </Select>
        )}
        {this.props.hasClpFeature && !['all', 'create'].includes(rule.action) && (
          <RuleTagsSelection rule={rule} onChange={onUpdateAttribute('metadataTagIds')} />
        )}
        {!isDisabled && (
          <Button onClick={onRemove} buttonType="naked" icon="Delete">
            Delete rule
          </Button>
        )}
      </div>
    );
  }
}
