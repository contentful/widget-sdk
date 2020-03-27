import React from 'react';
import PropTypes from 'prop-types';
import { get, memoize } from 'lodash';
import { css } from 'emotion';
import { Paragraph, List, ListItem, Note } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import ReferenceCard from './ReferenceCard';
import { getEntityTitle } from './referencesDialogService';
import { track } from 'analytics/Analytics';

const styles = {
  description: css({
    marginBottom: tokens.spacingM,
  }),
  list: css({
    marginLeft: 20,
  }),
  listItem: css({
    position: 'relative',
    margin: '0',
    '&:after': {
      content: '""',
      position: 'absolute',
      bottom: '0',
      width: '20px',
      height: '20px',
      background: 'white',
    },
  }),
  parentList: css({
    paddingBottom: tokens.spacingM,
    overflowY: 'scroll',
    '& > li': {
      '&:first-child:before, &:first-child:after': {
        display: 'none',
      },
    },
  }),
  noReferencesNote: css({
    marginBottom: tokens.spacingM,
  }),
};

const trackingEvents = {
  dialogOpen: 'entry_references:dialog_open',
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
    this.setState({ entryTitle });
  }

  renderReferenceCards = () => {
    const { root } = this.props;

    let isMoreCardRendered = false;
    let depth = 0;
    let circularReferenceCount = 0;
    const entitiesPerLevel = [];
    const visitedEntities = { 0: [root.sys.id] };

    const toReferenceCard = (entity, level, entityIndexInTree) => {
      const { maxLevel, onReferenceCardClick } = this.props;
      /**
       * if level > than maxLevel we still want to
       * know the max depth of the client's reference
       * tree so we continue the recursion without
       * returning a reference card
       */
      if (level > maxLevel) {
        // eslint-disable-next-line
        renderLayer(entity, level + 1, entityIndexInTree);
        if (!isMoreCardRendered) {
          isMoreCardRendered = true;
          return <ReferenceCard key={entity.sys.id} isMoreCard />;
        }
        return null;
      }
      isMoreCardRendered = false;

      // deleted entity is still referenced
      if (entity.sys.type === 'Link') {
        return <ReferenceCard entity={entity} key={entity.sys.id} isUnresolved />;
      }

      // eslint-disable-next-line
      const nextLevelCards = renderLayer(entity, level + 1, entityIndexInTree);
      const isCircular =
        visitedEntities[entityIndexInTree].filter((entityId) => entityId === entity.sys.id).length >
        1;

      return (
        <>
          <ReferenceCard
            key={entity.sys.id}
            entity={entity}
            onClick={onReferenceCardClick}
            isCircular={isCircular}
          />
          {/* recursevly get all cards for the entitiy fields */}
          {nextLevelCards}
        </>
      );
    };

    const renderLayer = (entity, level, entityIndexInTree) => {
      if (level > depth) {
        depth = level;
      }

      const { fields } = entity;

      // TODO: revisit the indexing to have items rendered on the correct layer
      const levelIndex = level - 1;
      entitiesPerLevel[levelIndex] = entitiesPerLevel[levelIndex]
        ? entitiesPerLevel[levelIndex] + 1
        : 1;

      if (!fields || level > failsaveLevel) {
        return null;
      }

      if (entityIndexInTree !== 0 && visitedEntities[entityIndexInTree].includes(entity.sys.id)) {
        circularReferenceCount++;
        return null;
      } else {
        if (entity.sys.id) {
          visitedEntities[entityIndexInTree].push(entity.sys.id);
        }
      }

      const { defaultLocale } = this.props;

      const nextLevelReferenceCards = Object.entries(fields).reduce(
        (allCards, [_, fieldValue], fieldIndex) => {
          const localizedFieldValue = fieldValue[defaultLocale];
          // if field is an array of entities
          if (
            Array.isArray(localizedFieldValue) &&
            localizedFieldValue.every((value) => value.sys)
          ) {
            return allCards.concat(
              localizedFieldValue.map((entity, index) => {
                const nextEntityIndexInTree = `${entityIndexInTree}.${fieldIndex}.${index}`;
                // console.log('setting visitedEntity for ', nextEntityIndexInTree);
                visitedEntities[nextEntityIndexInTree] = [...visitedEntities[entityIndexInTree]];
                return toReferenceCard(entity, level, nextEntityIndexInTree);
              })
            );
            // if rich text field
          } else if (Array.isArray(get(localizedFieldValue, 'content'))) {
            const getReferenceCardsFromContent = (content, parentIndex) => {
              // embedded-entry-inline is inside the nodeType paragraph, for example, so we first go depth first
              const entityContentToReferenceCards = (entity, entityIndex) =>
                Array.isArray(entity.content) && entity.content.length
                  ? getReferenceCardsFromContent(entity.content, entityIndex)
                  : [];
              return content.reduce((acc, entity, index) => {
                if (
                  [
                    'embedded-asset-block',
                    'embedded-entry-block',
                    'embedded-entry-inline',
                    'entry-hyperlink',
                  ].includes(entity.nodeType)
                ) {
                  const entityPayload = entity.data.target;
                  const nextEntityIndexInTree = `${parentIndex}.${fieldIndex}.${index}`;
                  visitedEntities[nextEntityIndexInTree] = [...visitedEntities[parentIndex]];
                  return [
                    ...acc,
                    ...entityContentToReferenceCards(entity, nextEntityIndexInTree),
                    toReferenceCard(entityPayload, level, nextEntityIndexInTree),
                  ];
                } else {
                  const nextEntityIndexInTree = `${parentIndex}.${fieldIndex}.${index}`;
                  visitedEntities[nextEntityIndexInTree] = [...visitedEntities[parentIndex]];
                  // if current node is not one of the embedded cards, we merge parsed child ref cards
                  // (possibly an empty array)
                  return acc.concat(entityContentToReferenceCards(entity, nextEntityIndexInTree));
                }
              }, []);
            };

            return allCards.concat(
              getReferenceCardsFromContent(localizedFieldValue.content, entityIndexInTree)
            );
            // if plain entity
          } else if (get(localizedFieldValue, 'sys')) {
            const nextEntityIndexInTree = `${entityIndexInTree}.${fieldIndex}`;
            visitedEntities[nextEntityIndexInTree] = [...visitedEntities[entityIndexInTree]];

            return [
              ...allCards,
              toReferenceCard(localizedFieldValue, level, nextEntityIndexInTree),
            ];
          }
          // otherwise, skip
          return allCards;
        },
        []
      );

      if (!nextLevelReferenceCards.length) {
        return null;
      }

      return (
        // All lists must be nested in list items
        <ListItem className={styles.listItem}>
          <List className={styles.list}>{nextLevelReferenceCards}</List>
        </ListItem>
      );
    };

    const level = 1;
    const parentIndexInTree = 0;
    const referenceCards = renderLayer(root, level, parentIndexInTree);

    track(trackingEvents.dialogOpen, {
      entity_id: root.sys.id,
      references_depth: depth,
      references_per_level: entitiesPerLevel,
      circular_references_count: circularReferenceCount,
    });

    return referenceCards;
  };

  render() {
    const { root } = this.props;

    const referencesTree = this.memoizedRenderReferenceCards();

    return (
      <>
        {referencesTree ? (
          <>
            <Paragraph className={styles.description}>Click an entry to edit or publish</Paragraph>
            <List className={styles.parentList}>
              <ReferenceCard entity={root} />
              {referencesTree}
            </List>
          </>
        ) : (
          <Note noteType="positive" className={styles.noReferencesNote}>
            This entry has no references
          </Note>
        )}
      </>
    );
  }
}

ReferencesTree.propTypes = {
  root: PropTypes.object.isRequired,
  // TODO: right now default locale has incorrect value
  defaultLocale: PropTypes.string,
  maxLevel: PropTypes.number,
  onReferenceCardClick: PropTypes.func.isRequired,
};

ReferencesTree.defaultProps = {
  maxLevel: 5,
};

export default ReferencesTree;
