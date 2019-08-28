import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import _ from 'lodash';
import {
  ModalConfirm,
  List,
  ListItem,
  Paragraph,
  EntityList
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import * as slideInNavigator from 'navigation/SlideInNavigator/index.es6';
import WrappedEntityListItem from './WrappedEntityListItem.es6';
import localeStore from 'services/localeStore.es6';

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

const styles = {
  field: css({
    marginBottom: tokens.spacingM
  }),
  fieldTitle: css({
    marginBottom: tokens.spacingXs
  }),
  unpublishedReferencesList: css({
    margin: `0 -${tokens.spacingM}`,
    padding: `0 ${tokens.spacingM}`,
    maxHeight: '350px',
    overflowY: 'auto'
  }),
  skeleton: css({
    marginTop: tokens.spacingM
  }),
  entryListItem: css({
    cursor: 'pointer',
    marginBottom: 0
  }),
  description: css({
    marginBottom: tokens.spacingM
  })
};

class UnpublishedReferencesConfirm extends Component {
  static propTypes = {
    isShown: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    contentTypes: PropTypes.array.isRequired,
    unpublishedReferencesInfo: PropTypes.array.isRequired,
    modalTitle: PropTypes.string,
    confirmLabel: PropTypes.string
  };

  static defaultProps = {
    modalTitle: 'Are you sure you want to publish this entry?',
    confirmLabel: 'Publish anyway'
  };

  onEntityListClick = (e, reference) => {
    if (!e.metaKey) {
      e.preventDefault();
      this.props.onCancel();
      slideInNavigator.goToSlideInEntity({ type: reference.sys.type, id: reference.sys.id });
    }
  };

  renderUnpublishedRefsInfo({ field, references }) {
    const localeName = localeStore
      .getLocales()
      .find(locale => locale.internal_code === field.internalLocaleCode).name;
    const fieldInfo = <strong>{`${field.name} - ${localeName}`}</strong>;
    const [referenceMessage] = humaniseReferencesMessage(references);
    return (
      <div className={styles.field}>
        <div className={styles.fieldTitle}>
          {fieldInfo}
          {references.length > 1 ? ` - ${referenceMessage}` : ''}
        </div>

        <EntityList>
          {references.map(entity => {
            return (
              <WrappedEntityListItem
                key={entity.sys.id}
                entity={entity}
                internalLocaleCode={field.internalLocaleCode}
                onClick={e => this.onEntityListClick(e, entity)}
              />
            );
          })}
        </EntityList>
      </div>
    );
  }

  render() {
    const { onConfirm, onCancel, isShown, modalTitle, confirmLabel } = this.props;

    const unpublishedReferencesInfo = _.filter(
      this.props.unpublishedReferencesInfo,
      ({ references }) => references.length > 0
    );

    const references = _.flatMap(unpublishedReferencesInfo, 'references');

    const [descriptionMsg, isPlural] = humaniseReferencesMessage(references, false);
    const description = `It appears that you’ve linked to ${descriptionMsg} that ${
      isPlural ? "haven't" : "hasn't"
    } been published yet.`;

    return (
      <ModalConfirm
        testId="unpublished-refs-confirm"
        title={modalTitle}
        isShown={isShown}
        intent="negative"
        confirmLabel={confirmLabel}
        allowHeightOverflow
        onConfirm={onConfirm}
        onCancel={onCancel}>
        <Paragraph className={styles.description}>{description}</Paragraph>
        <List className={styles.unpublishedReferencesList}>
          {this.props.unpublishedReferencesInfo.map((item, idx) => (
            <ListItem key={idx}>{this.renderUnpublishedRefsInfo(item)}</ListItem>
          ))}
        </List>
      </ModalConfirm>
    );
  }
}

export default UnpublishedReferencesConfirm;
