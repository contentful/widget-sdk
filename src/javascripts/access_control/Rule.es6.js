import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';

const ServicesConsumer = require('../reactServiceContext').default;

const contentTypesToOptions = (CONFIG, contentTypes) =>
  [
    {
      id: CONFIG.ALL_CTS,
      name: 'All content types'
    }
  ].concat(contentTypes.map(({ sys: { id }, name }) => ({ id, name })));

const getEntityName = entity => {
  if (entity === 'entry') {
    return ['entry', 'Entries'];
  } else {
    return ['asset', 'Assets'];
  }
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
      field: PropTypes.string,
      locale: PropTypes.string
    }),
    entity: PropTypes.string,
    onRemove: PropTypes.func.isRequired,
    $services: PropTypes.shape(),
    onUpdateAttribute: PropTypes.func.isRequired
  };

  state = {};

  constructor(props) {
    super(props);

    const {
      $services: { CONFIG, TheLocaleStore, spaceContext }
    } = props;

    this.locales = [{ code: CONFIG.ALL_LOCALES, name: 'All locales' }].concat(
      TheLocaleStore.getPrivateLocales().map(({ code, name }) => ({
        code,
        name: `${name} (${code})`
      }))
    );
    this.contentTypes = contentTypesToOptions(CONFIG, spaceContext.publishedCTs.getAllBare());
  }

  static getDerivedStateFromProps(props) {
    const {
      rule,
      $services: { spaceContext, CONFIG }
    } = props;

    const ct = spaceContext.publishedCTs.get(rule.contentType);
    return {
      contentTypeFields: [
        {
          id: CONFIG.ALL_FIELDS,
          name: 'All fields'
        }
      ].concat(
        get(ct, ['data', 'fields'], []).map(({ id, name, apiName }) => ({
          id: apiName || id,
          name
        }))
      )
    };
  }

  render() {
    const { isDisabled, entity, onRemove, onUpdateAttribute, rule } = this.props;
    const entityName = getEntityName(entity);

    return (
      <div className="rule-list__rule">
        <select
          className="cfnext-select-box"
          data-test-id="action"
          disabled={isDisabled}
          value={rule.action}
          onChange={onUpdateAttribute('action')}>
          <option value="all">All actions</option>
          <option value="read">Read</option>
          <option value="update">Edit</option>
          <option value="create">Create</option>
          <option value="delete">Delete</option>
          <option value="archive">Archive/Unarchive</option>
          <option value="publish">Publish/Unpublish</option>
        </select>
        <select
          className="cfnext-select-box"
          data-test-id="scope"
          disabled={rule.action === 'create' || isDisabled}
          value={rule.scope}
          onChange={onUpdateAttribute('scope')}>
          <option value="any">{`Any ${entityName[0]}`}</option>
          <option value="user">{`${entityName[1]} created by user`}</option>
        </select>
        {entity === 'entry' && (
          <React.Fragment>
            <select
              className="cfnext-select-box"
              data-test-id="contentType"
              disabled={isDisabled}
              value={rule.contentType}
              onChange={onUpdateAttribute('contentType')}>
              {this.contentTypes.map(({ id, name }) => (
                <option value={id} key={id}>
                  {name}
                </option>
              ))}
            </select>
            {rule.action === 'update' && (
              <select
                className="cfnext-select-box"
                data-test-id="field"
                disabled={rule.contentType === 'all' || isDisabled}
                value={rule.field}
                onChange={onUpdateAttribute('field')}>
                {this.state.contentTypeFields.map(({ id, name }) => (
                  <option value={id} key={id}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </React.Fragment>
        )}
        {rule.action === 'update' && (
          <select
            className="cfnext-select-box"
            data-test-id="locale"
            disabled={isDisabled}
            value={rule.locale}
            onChange={onUpdateAttribute('locale')}>
            {this.locales.map(({ code, name }) => (
              <option value={code} key={code}>
                {name}
              </option>
            ))}
          </select>
        )}
        {!isDisabled && (
          <a className="rule-list__remove" onClick={onRemove}>
            <i className="fa fa-trash" />
          </a>
        )}
      </div>
    );
  }
}

export default ServicesConsumer('TheLocaleStore', 'spaceContext', {
  from: 'PolicyBuilder/CONFIG',
  as: 'CONFIG'
})(Rule);
