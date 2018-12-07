import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { ModalConfirm } from '@contentful/forma-36-react-components';

class UnpublishedReferencesConfirm extends Component {
  static propTypes = {
    isShown: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    linkedEntityTypes: PropTypes.array.isRequired,
    unpublishedRefs: PropTypes.array.isRequired
  };

  render() {
    const { onConfirm, onCancel, isShown, linkedEntityTypes, unpublishedRefs } = this.props;
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
          {unpublishedRefs.map((item, idx) => (
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
