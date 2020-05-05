import React from 'react';
import PropTypes from 'prop-types';
import { get, memoize } from 'lodash';
import { css } from 'emotion';
import { List, ListItem } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import ReferenceCard from './ReferenceCard';
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

  state = {
    selectedEntities: [],
  };

  findValidationErrorForEntity = (entityId) => {
    const { validations } = this.props;
    if (!validations) {
      return null;
    }

    if (!validations.errored) {
      return null;
    }
    const errored = validations.errored.find((errored) => errored.sys.id === entityId);
    return errored ? errored.error.message : null;
  };

  handleSelect = (selected, selectedEntity) => {
    this.setState(
      {
        selectedEntities: selected
          ? [...this.state.selectedEntities, selectedEntity]
          : this.state.selectedEntities.filter((entity) => entity.sys.id !== selectedEntity.sys.id),
      },
      () => {
        this.props.onSelectEntities(this.state.selectedEntities);
      }
    );
  };

  renderReferenceCards = () => {
    const { root, onSelectEntities, allReferencesSelected, setIsTreeMaxDepthReached } = this.props;

    let isMoreCardRendered = false;
    let depth = 0;
    let circularReferenceCount = 0;
    const entitiesPerLevel = [];
    const visitedEntities = { 0: [root.sys.id] };
    const initialSelectedEntities = [];

    const toReferenceCard = (entity, level, entityIndexInTree) => {
      const { maxLevel, onReferenceCardClick } = this.props;

      if (level === maxLevel) {
        setIsTreeMaxDepthReached(true);
      }
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
        <React.Fragment key={`container-${entity.sys.id}`}>
          <ReferenceCard
            key={entity.sys.id}
            entity={entity}
            onClick={onReferenceCardClick}
            isCircular={isCircular}
            validationError={this.findValidationErrorForEntity(entity.sys.id)}
            isReferenceSelected={allReferencesSelected}
            onReferenceCheckboxClick={(checked, entity) => this.handleSelect(checked, entity)}
          />
          {/* recursevly get all cards for the entitiy fields */}
          {nextLevelCards}
        </React.Fragment>
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

      if (allReferencesSelected) {
        initialSelectedEntities.push(entity);
      }

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
        <ListItem className={styles.listItem}>
          <List className={styles.list}>{nextLevelReferenceCards}</List>
        </ListItem>
      );
    };

    const level = 1;
    const parentIndexInTree = 0;
    const referenceCards = renderLayer(root, level, parentIndexInTree);

    this.setState({
      selectedEntities: initialSelectedEntities,
    });
    onSelectEntities(initialSelectedEntities);

    track(trackingEvents.dialogOpen, {
      entity_id: root.sys.id,
      references_depth: depth,
      references_per_level: entitiesPerLevel,
      circular_references_count: circularReferenceCount,
    });

    return referenceCards;
  };

  render() {
    const { root, allReferencesSelected } = this.props;

    const referencesTree = this.memoizedRenderReferenceCards();

    return (
      <List className={styles.parentList} testId="referenceTreeList">
        <ReferenceCard
          entity={root}
          isReferenceSelected={allReferencesSelected}
          onReferenceCheckboxClick={(checked, entity) => this.handleSelect(checked, entity)}
          validationError={this.findValidationErrorForEntity(root.sys.id)}
        />
        {referencesTree}
      </List>
    );
  }
}

ReferencesTree.propTypes = {
  root: PropTypes.object.isRequired,
  // TODO: right now default locale has incorrect value
  defaultLocale: PropTypes.string,
  maxLevel: PropTypes.number,
  allReferencesSelected: PropTypes.bool,
  validations: PropTypes.shape({
    errored: PropTypes.arrayOf(
      PropTypes.shape({
        sys: PropTypes.shape({
          type: PropTypes.string,
          linkType: PropTypes.string,
          id: PropTypes.string,
        }),
        error: PropTypes.shape({
          message: PropTypes.string,
        }),
      })
    ),
  }),
  onReferenceCardClick: PropTypes.func.isRequired,
  onSelectEntities: PropTypes.func,
  setIsTreeMaxDepthReached: PropTypes.func,
};

ReferencesTree.defaultProps = {
  maxLevel: 5,
  onSelectEntities: () => {},
  setIsTreeMaxDepthReached: () => {},
};

export default ReferencesTree;
