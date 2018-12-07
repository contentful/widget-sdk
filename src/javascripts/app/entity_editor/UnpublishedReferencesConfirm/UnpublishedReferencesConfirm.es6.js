import React, { Component } from 'react';
import PropTypes from 'prop-types';

import _ from 'lodash';

import { ModalConfirm } from '@contentful/forma-36-react-components';

class UnpublishedReferencesConfirm extends Component {
  static propTypes = {
    isShown: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    unpublishedReferences: PropTypes.array.isRequired
  };

  render() {
    const { onConfirm, onCancel, isShown } = this.props;

    const unpublishedReferences = _.filter(
      this.props.unpublishedReferences,
      ref => ref && ref.count > 0
    );

    const counts = _.countBy(unpublishedReferences, 'linked');
    const linkedEntityTypes = [counts.Entry > 0 && 'entries', counts.Asset > 0 && 'assets'];

    const entityTypesMsg = linkedEntityTypes.join(' and ');

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
          {unpublishedReferences.map((item, idx) => (
            <li key={idx}>
              <strong>{item.fieldName}</strong> — {item.count} unpublished {item.type}
            </li>
          ))}
        </ul>
      </ModalConfirm>
    );
  }
}

export default UnpublishedReferencesConfirm;
