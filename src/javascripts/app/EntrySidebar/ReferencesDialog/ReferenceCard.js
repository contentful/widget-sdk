import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { Card, Paragraph, Icon, ListItem } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { EntityStatusTag } from 'components/shared/EntityStatusTag';
import * as EntityState from 'data/CMA/EntityState';
import { getEntityTitle } from './referencesDialogService';

const styles = {
  card: css({
    display: 'flex',
    padding: `${tokens.spacing2Xs} ${tokens.spacingXs}`,
    alignItems: 'center',
    marginBottom: tokens.spacing2Xs,
    position: 'relative'
  }),
  listItem: css({
    position: 'relative',
    '&:first-child:before': {
      position: 'absolute',
      left: '-10px',
      top: '1px',
      content: '""',
      display: 'block',
      borderLeft: `1px solid ${tokens.colorElementMid}`,
      height: '1em',
      borderBottom: `1px solid ${tokens.colorElementMid}`,
      width: '20px'
    },
    '&:first-child:after': {
      position: 'absolute',
      left: '-10px',
      bottom: '20px',
      content: '""',
      display: 'block',
      borderLeft: `1px solid ${tokens.colorElementMid}`,
      height: '100%',
      zIndex: '-1'
    }
  }),
  status: css({
    marginLeft: 'auto'
  }),
  assetIcon: css({
    marginRight: tokens.spacing2Xs
  }),
  text: css({
    maxWidth: '100%',
    overflow: 'hidden',
    marginRight: tokens.spacingM,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center'
  })
};

const ReferenceCard = ({ entity, onClick, isMoreCard }) => {
  const [title, setTitle] = useState('Untitled');

  useEffect(() => {
    async function getTitle() {
      if (entity) {
        const fetchedTitle = await getEntityTitle(entity);
        setTitle(fetchedTitle || 'Untitled');
      }
    }
    getTitle();
  }, [entity]);

  if (isMoreCard) {
    return (
      <ListItem
        className={styles.listItem}
        title="There are more references, click the parent entry to see all of them.">
        <Card className={styles.card}>+ more</Card>
      </ListItem>
    );
  }

  if (!entity) {
    return null;
  }

  return (
    <ListItem className={styles.listItem}>
      <Card className={styles.card} onClick={() => onClick(entity)}>
        {entity.sys.type === 'Asset' && (
          <Icon icon={entity.sys.type} color="muted" className={styles.assetIcon} />
        )}
        <Paragraph className={styles.text} title={title}>
          {title}
        </Paragraph>
        <EntityStatusTag
          statusLabel={EntityState.stateName(EntityState.getState(entity.sys))}
          className={styles.status}
        />
      </Card>
    </ListItem>
  );
};

export const ReferencePropType = PropTypes.shape({
  sys: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired
  })
});

ReferenceCard.propTypes = {
  entity: ReferencePropType,
  onClick: PropTypes.func.isRequired,
  isMoreCard: PropTypes.bool
};

export default ReferenceCard;
