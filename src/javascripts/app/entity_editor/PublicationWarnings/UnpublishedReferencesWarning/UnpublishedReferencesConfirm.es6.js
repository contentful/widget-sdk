import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { ModalConfirm, List, ListItem, Paragraph } from '@contentful/forma-36-react-components';

const humaniseEntityType = (type, references) => {
  const plurals = {
    Entry: 'entries',
    Asset: 'assets'
  };
  return references.length > 1 ? plurals[type] : type.toLowerCase();
};

const getEntitiesMessage = (entities, type, shouldExplicitlyMentionUnpublish) => {
  return [
    entities.length,
    shouldExplicitlyMentionUnpublish && 'unpublished',
    humaniseEntityType(type, entities)
  ]
    .filter(Boolean)
    .join(' ');
};

const humaniseReferencesMessage = (references, shouldExplicitlyMentionUnpublish = true) => {
  const assets = references.filter(({ sys }) => sys.type === 'Asset');
  const entries = references.filter(({ sys }) => sys.type === 'Entry');
  const messages = [];

  if (entries.length > 0) {
    messages.push(getEntitiesMessage(entries, 'Entry', shouldExplicitlyMentionUnpublish));
  }
  if (assets.length > 0) {
    messages.push(getEntitiesMessage(assets, 'Asset', shouldExplicitlyMentionUnpublish));
  }

  const isPlural = references.length > 1;
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

    return (
      <React.Fragment>
        {fieldInfo} — {humaniseReferencesMessage(references)}
      </React.Fragment>
    );
  }

  render() {
    const { onConfirm, onCancel, isShown } = this.props;

    const unpublishedReferencesInfo = _.filter(
      this.props.unpublishedReferencesInfo,
      ({ references }) => references.length > 0
    );

    const references = _.flatMap(unpublishedReferencesInfo, 'references');
    const [titleMsg] = humaniseReferencesMessage(references);

    const [descriptionMsg, isPlural] = humaniseReferencesMessage(references, false);
    const description = `It appears that you’ve linked to ${descriptionMsg} that ${
      isPlural ? "haven't" : "hasn't"
    } been published yet.`;

    return (
      <ModalConfirm
        testId="unpublished-refs-confirm"
        title={`This entry links to ${titleMsg}`}
        isShown={isShown}
        confirmLabel="Got it, publish anyway"
        onConfirm={onConfirm}
        onCancel={onCancel}>
        <Paragraph>{description}</Paragraph>
        <List>
          {unpublishedReferencesInfo.map((item, idx) => (
            <ListItem key={idx}>{this.renderUnpublishedRefsInfo(item)}</ListItem>
          ))}
        </List>
      </ModalConfirm>
    );
  }
}

export default UnpublishedReferencesConfirm;
