import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { css } from 'emotion';
import getLocales from 'access_control/getLocales';
import tokens from '@contentful/forma-36-tokens';
import { Select, Option, Button } from '@contentful/forma-36-react-components';
import { PolicyBuilderConfig } from 'access_control/PolicyBuilder';

const contentTypesToOptions = contentTypes =>
  [
    {
      id: PolicyBuilderConfig.ALL_CTS,
      name: 'All content types'
    }
  ].concat(contentTypes.map(({ sys: { id }, name }) => ({ id, name })));

const getEntityName = entity => {
  if (entity === 'entry') {
    return ['Entry', 'Entries'];
  } else {
    return ['Asset', 'Assets'];
  }
};

const styles = {
  ruleList: css({
    display: 'flex',
    margin: `${tokens.spacingM} 0`,
    alignItems: 'center',
    flexWrap: 'wrap'
  }),
  select: css({
    marginRight: tokens.spacingS,
    marginTop: tokens.spacingXs,
    marginBottom: tokens.spacingXs
  })
};

class Rule extends React.Component {
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
      locale: PropTypes.string
    }),
    entity: PropTypes.string,
    onRemove: PropTypes.func.isRequired,
    onUpdateAttribute: PropTypes.func.isRequired,
    privateLocales: PropTypes.array.isRequired,
    contentTypes: PropTypes.array.isRequired,
    searchEntities: PropTypes.func.isRequired,
    getEntityTitle: PropTypes.func.isRequired
  };

  state = {};

  constructor(props) {
    super(props);
    this.contentTypes = contentTypesToOptions(props.contentTypes);
    this.state.entities = {};
  }

  static getDerivedStateFromProps(props) {
    const { rule, contentTypes } = props;

    const ct = contentTypes.find(ct => ct.sys.id === rule.contentType);
    return {
      contentTypeFields: [
        {
          id: PolicyBuilderConfig.ALL_FIELDS,
          name: 'All fields'
        }
      ].concat(
        get(ct, ['fields'], []).map(({ id, name, apiName }) => ({
          id: apiName || id,
          name
        }))
      )
    };
  }

  searchEntitiesAndUpdate = () => {
    const { entity, searchEntities, onUpdateAttribute } = this.props;
    const entityName = getEntityName(entity);

    searchEntities(entityName[0]).then(entity => {
      if (entity) {
        if (entityName[0] === 'Entry') {
          onUpdateAttribute('contentType')({
            target: { value: entity.sys.contentType.sys.id }
          });
        }
        onUpdateAttribute('entityId')({ target: { value: entity.sys.id } });
        return entity.sys.id;
      }
      return null;
    });
  };

  updateScope = event => {
    const { rule, onUpdateAttribute } = this.props;
    if (event.target.value === 'entityId' && !rule.entityId) {
      return this.searchEntitiesAndUpdate().then(entityId => {
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
      getEntityTitle
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
          <Option value="all">All actions</Option>
          <Option value="read">Read</Option>
          <Option value="update">Edit</Option>
          <Option value="create">Create</Option>
          <Option value="delete">Delete</Option>
          <Option value="archive">Archive/Unarchive</Option>
          <Option value="publish">Publish/Unpublish</Option>
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
            {getEntityTitle(rule.entityId, rule.contentType)}
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
        {rule.action === 'update' && (
          <Select
            className={styles.select}
            width="medium"
            testId="locale"
            isDisabled={isDisabled}
            value={rule.locale}
            onChange={onUpdateAttribute('locale')}>
            {getLocales(privateLocales).map(({ code, name }) => (
              <Option value={code} key={code}>
                {name}
              </Option>
            ))}
          </Select>
        )}
        {!isDisabled && (
          <Button onClick={onRemove} buttonType="naked" icon="Close" size="small">
            Delete rule
          </Button>
        )}
      </div>
    );
  }
}

export default Rule;
