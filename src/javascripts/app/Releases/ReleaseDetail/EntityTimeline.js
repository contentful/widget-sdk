import React from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import pluralize from 'pluralize';
import tokens from '@contentful/forma-36-tokens';
import { List, Subheading } from '@contentful/forma-36-react-components';
import AssetEntityCard from './AssetEntityCard';
import EntryEntityCard from './EntryEntityCard';

const styles = {
  timeline: css({
    border: `1px solid ${tokens.colorElementLight}`,
    borderRadius: '2px',
    marginBottom: tokens.spacingM,
    width: '70%',
  }),
  timelineHeader: css({
    display: 'flex',
    backgroundColor: tokens.colorElementLight,
    height: tokens.spacing2Xl,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: tokens.spacingM,
    paddingRight: tokens.spacingM,
    borderTopLeftRadius: '2px',
    borderTopRightRadius: '2px',
  }),
  list: css({
    margin: tokens.spacingM,
  }),
  assetList: css({
    display: 'flex',
    flexFlow: 'wrap',
  }),
};

const EntityTimeline = ({
  groupedEntities,
  handleEntityDelete,
  defaultLocale,
  contentType,
  entityType,
}) => {
  const groupedEntitiesLength = groupedEntities.length;
  const cardMap = {
    Entry: EntryEntityCard,
    Asset: AssetEntityCard,
  };
  const CardType = cardMap[entityType];
  return (
    <div className={styles.timeline}>
      <div className={styles.timelineHeader}>
        <Subheading element="h2">{contentType}</Subheading>
        <span>{pluralize('item', groupedEntitiesLength, true)}</span>
      </div>
      <List
        testId="release-entity-timeline"
        className={cx(styles.list, { [styles.assetList]: entityType === 'Asset' })}>
        {groupedEntities.map((entity, index) => (
          <li key={`release-${index}`} data-test-id="release-entity-list">
            <CardType
              handleEntityDelete={handleEntityDelete}
              entity={entity}
              defaultLocale={defaultLocale}
              entityKey={`${index}`}
            />
          </li>
        ))}
      </List>
    </div>
  );
};

EntityTimeline.propTypes = {
  groupedEntities: PropTypes.array.isRequired,
  defaultLocale: PropTypes.object.isRequired,
  handleEntityDelete: PropTypes.func.isRequired,
  contentType: PropTypes.string.isRequired,
  entityType: PropTypes.string.isRequired,
};

export default EntityTimeline;
