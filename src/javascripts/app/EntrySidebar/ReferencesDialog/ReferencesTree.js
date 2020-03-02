import React from 'react';
import PropTypes from 'prop-types';
import { get, memoize } from 'lodash';
import { css } from 'emotion';
import { Paragraph, List } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { track } from 'analytics/Analytics';
import ReferenceCard from './ReferenceCard';
import { getEntityTitle } from './referencesDialogService';

const styles = {
  description: css({
    marginBottom: tokens.spacingM
  }),
  list: css({
    marginLeft: 20
  }),
  parentList: css({
    paddingBottom: tokens.spacingM,
    overflowY: 'scroll',
    '& > li': {
      '&:first-child:before, &:first-child:after': {
        display: 'none'
      }
    }
  })
};

const trackingEvents = {
  dialogOpen: 'entry_references:dialog_open'
};

// If there is a circular reference that is not handled this will keep us from endless.
const failsaveLevel = 10;
class ReferencesTree extends React.Component {
  constructor(props) {
    super(props);
    this.memoizedRenderReferenceCards = memoize(this.renderReferenceCards);
  }

  async componentDidMount() {
    const entryTitle = await getEntityTitle(this.props.root);
    this.setState({
      entryTitle
    });
  }

  renderReferenceCards = () => {
    const { root } = this.props;

    let depth = 0;
    const entitiesPerLevel = [];
    const visitedEntries = [];
    let isMoreCardRendered = false;

    const toReferenceCard = (entity, level) => {
      const { maxLevel, onReferenceCardClick } = this.props;
      /**
       * if level > than maxLevel we still want to
       * know the max depth of the client's reference
       * tree so we continue the recursion without
       * returning a reference card
       */
      if (level > maxLevel) {
        // eslint-disable-next-line
        renderLayer(entity.fields, level + 1);
        if (!isMoreCardRendered) {
          isMoreCardRendered = true;
          return <ReferenceCard isMoreCard />;
        }
        return null;
      }
      isMoreCardRendered = false;

      return (
        <>
          <ReferenceCard key={entity.sys.id} entity={entity} onClick={onReferenceCardClick} />
          {/* recursevly get all cards for the entitiy fields */}
          {/* eslint-disable-next-line */}
          {renderLayer(entity.fields, level + 1)}
        </>
      );
    };

    const renderLayer = (fields, level) => {
      if (level > depth) {
        depth = level;
      }

      const levelIndex = level - 1;
      entitiesPerLevel[levelIndex] = entitiesPerLevel[levelIndex]
        ? entitiesPerLevel[levelIndex] + 1
        : 1;

      if (!fields || level > failsaveLevel) {
        return null;
      }

      const { defaultLocale } = this.props;

      const nextLevelReferenceCards = Object.entries(fields).reduce((allCards, [_, fieldValue]) => {
        const localizedFieldValue = fieldValue[defaultLocale];
        // if field is an array of entities
        if (Array.isArray(localizedFieldValue)) {
          return allCards.concat(
            localizedFieldValue.map(entity => {
              if (!visitedEntries.includes(entity.sys.id)) {
                visitedEntries.push(entity.sys.id);
              }
              return toReferenceCard(entity, level);
            })
          );
          // if rich text field
        } else if (Array.isArray(get(localizedFieldValue, 'content'))) {
          const getReferenceCardsFromContent = content => {
            return content.reduce((acc, entity) => {
              const entityPayload = entity.data.target;
              // embedded-entry-inline is inside the nodeType paragraph, for example, so we first go depth first
              const innerContentRefCards =
                Array.isArray(entity.content) && entity.content.length
                  ? getReferenceCardsFromContent(entity.content)
                  : [];

              // if current node is not one of the embedded cards, we merge parsed child ref cards
              // (possibly an empty array)
              if (
                !['embedded-asset-block', 'embedded-entry-block', 'embedded-entry-inline'].includes(
                  entity.nodeType
                )
              ) {
                return acc.concat(innerContentRefCards);
              }

              if (!visitedEntries.includes(entityPayload.sys.id)) {
                visitedEntries.push(entityPayload.sys.id);
              }
              return [...acc, ...innerContentRefCards, toReferenceCard(entityPayload, level)];
            }, []);
          };

          return allCards.concat(getReferenceCardsFromContent(localizedFieldValue.content));
          // if plain entity
        } else if (get(localizedFieldValue, 'sys')) {
          if (!visitedEntries.includes(localizedFieldValue.sys.id)) {
            visitedEntries.push(localizedFieldValue.sys.id);
          }
          return [...allCards, toReferenceCard(localizedFieldValue, level)];
        }
        // otherwise, skip
        return allCards;
      }, []);

      if (!nextLevelReferenceCards.length) {
        return null;
      }

      return <List className={styles.list}>{nextLevelReferenceCards}</List>;
    };

    const results = renderLayer(root.fields, 0);
    track(trackingEvents.dialogOpen, {
      references_depth: depth,
      references_per_level: entitiesPerLevel
    });

    return results;
  };

  render() {
    const { root } = this.props;

    return (
      <>
        <Paragraph className={styles.description}>Click an entry to edit or publish</Paragraph>
        <List className={styles.parentList}>
          <ReferenceCard entity={root} />
          {this.memoizedRenderReferenceCards()}
        </List>
      </>
    );
  }
}

ReferencesTree.propTypes = {
  root: PropTypes.object.isRequired,
  // TODO: right now default locale has incorrect value
  defaultLocale: PropTypes.string,
  maxLevel: PropTypes.number,
  onReferenceCardClick: PropTypes.func
};

ReferencesTree.defaultProps = {
  maxLevel: 5
};

export default ReferencesTree;
