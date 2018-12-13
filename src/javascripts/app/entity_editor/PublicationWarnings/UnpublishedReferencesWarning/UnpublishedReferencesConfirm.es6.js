import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { ModalConfirm } from '@contentful/forma-36-react-components';

const humaniseEntityType = (type, references) => {
  const plurals = {
    Entry: 'entries',
    Asset: 'assets'
  };
  return references.length > 1 ? plurals[type] : type.toLowerCase();
};

const humaniseReferencesMessage = references => {
  const messages = _(references)
    .groupBy(ref => ref.sys.type)
    .mapKeys((value, key) => humaniseEntityType(key, value))
    .keys()
    .value();

  const isPlural = messages.length > 1;
  return [messages.join(' and '), isPlural];
};

class UnpublishedReferencesConfirm extends Component {
  static propTypes = {
    isShown: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    unpublishedReferencesInfo: PropTypes.array.isRequired
  };

  renderUnpublishedRefsInfo({ field, references }) {
    const fieldInfo = <strong>{`${field.name} (${field.locale})`}</strong>;
    const assets = references.filter(({ sys }) => sys.type === 'Asset');
    const entries = references.filter(({ sys }) => sys.type === 'Entry');

    const refInfo = (
      <React.Fragment>
        {entries.length > 0 && (
          <React.Fragment>
            {entries.length} unpublished {humaniseEntityType('Entry', entries)}
          </React.Fragment>
        )}{' '}
        {entries.length > 0 && assets.length > 0 ? ' and ' : ''}
        {assets.length > 0 && (
          <React.Fragment>
            {assets.length} unpublished {humaniseEntityType('Asset', assets)}
          </React.Fragment>
        )}
      </React.Fragment>
    );
    return (
      <React.Fragment>
        {fieldInfo} — {refInfo}
      </React.Fragment>
    );
  }

  render() {
    const { onConfirm, onCancel, isShown } = this.props;

    const unpublishedReferencesInfo = _.filter(
      this.props.unpublishedReferencesInfo,
      ({ references }) => references.length > 0
    );

    const [entityTypesMsg, isPlural] = humaniseReferencesMessage(
      _.flatMap(unpublishedReferencesInfo, 'references')
    );

    return (
      <ModalConfirm
        testId="unpublished-refs-confirm"
        title={`This entry links to unpublished ${entityTypesMsg}`}
        isShown={isShown}
        confirmLabel="Got it, publish anyway"
        onConfirm={onConfirm}
        onCancel={onCancel}>
        <p>
          It appears that you’ve linked to {entityTypesMsg} that {isPlural ? "haven't" : "hasn't"}{' '}
          been published yet.
        </p>
        <ul>
          {unpublishedReferencesInfo.map((item, idx) => (
            <li key={idx}>{this.renderUnpublishedRefsInfo(item)}</li>
          ))}
        </ul>
      </ModalConfirm>
    );
  }
}

export default UnpublishedReferencesConfirm;
