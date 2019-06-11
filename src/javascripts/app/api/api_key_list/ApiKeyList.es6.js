import React from 'react';
import PropTypes from 'prop-types';
import { cx } from 'emotion';
import StateLink from 'app/common/StateLink.es6';

const placeholderKeys = [
  {
    id: '1',
    name: 'Website key',
    description: 'Use this key in your website'
  },
  {
    id: '2',
    name: 'iOS key',
    description: 'Use this key in your iOS app'
  },
  {
    id: '3',
    name: 'Android key',
    description: 'Use this key in your Android app'
  }
];

export default function ApiKeyList({ apiKeys }) {
  const hasKeys = apiKeys && apiKeys.length;

  return (
    <div className="api-key-list entity-list">
      {(hasKeys ? apiKeys : placeholderKeys).map(key => (
        <StateLink
          key={hasKeys ? key.sys.id : key.name}
          className={cx('entity-list__item x--with-icon', {
            'api-key-list__placeholder': !hasKeys
          })}
          to={hasKeys ? '^.detail' : ''}
          params={hasKeys ? { apiKeyId: key.sys.id } : null}
          data-test-id="api-link">
          <span>
            <h3 className="entity-list__heading">{key.name}</h3>
            <span className="entityt-list__description">{key.description}</span>
          </span>
        </StateLink>
      ))}
    </div>
  );
}

ApiKeyList.defaultProps = {
  apiKeys: []
};

ApiKeyList.propTypes = {
  apiKeys: PropTypes.arrayOf(PropTypes.object)
};
