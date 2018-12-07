import React, { Component } from 'react';
import PropTypes from 'prop-types';

import _ from 'lodash';

import { ModalConfirm } from '@contentful/forma-36-react-components';

const humaniseEntityType = (entityType, references) => {
  const plurals = {
    Entry: 'entries',
    Asset: 'assets'
  };
  return references.length > 1 ? plurals[entityType] : entityType;
};

class UnpublishedReferencesConfirm extends Component {
  static propTypes = {
    isShown: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    unpublishedReferencesInfos: PropTypes.array.isRequired
  };

  render() {
    const { onConfirm, onCancel, isShown } = this.props;

    const unpublishedReferencesInfos = _.filter(
      this.props.unpublishedReferencesInfos,
      ({ references }) => references.length > 0
    );

    const entityTypesMsg = _(unpublishedReferencesInfos)
      .chain()
      .map(({ field }) => (field.itemLinkType === 'Entry' ? 'entries' : 'assets'))
      .uniq()
      .value()
      .join(' and ');

    return (
      <ModalConfirm
        testId="unpublished-refs-confirm"
        title={`This entry links to unpublished ${entityTypesMsg}`}
        intent="negative"
        isShown={isShown}
        confirmLabel="Got it, publish anyway"
        onConfirm={onConfirm}
        onCancel={onCancel}>
        <p>It appears that you’ve linked to {entityTypesMsg} that haven’t been published yet.</p>
        <ul>
          {unpublishedReferencesInfos.map((item, idx) => (
            <li key={idx}>
              <strong>{`${item.field.name} (${item.field.locale})'`}</strong> —{' '}
              {item.references.length} unpublished{' '}
              {humaniseEntityType(item.field.itemLinkType, item.references)}
            </li>
          ))}
        </ul>
      </ModalConfirm>
    );
  }
}

export default UnpublishedReferencesConfirm;
