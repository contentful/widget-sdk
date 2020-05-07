import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import { noop } from 'lodash';
import {
  Card,
  Paragraph,
  Icon,
  ListItem,
  Tooltip,
  Checkbox,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { EntityStatusTag } from 'components/shared/EntityStatusTag';
import * as EntityState from 'data/CMA/EntityState';
import { getEntityTitle } from './referencesService';

const styles = {
  card: css({
    display: 'flex',
    padding: `${tokens.spacing2Xs} ${tokens.spacingXs}`,
    alignItems: 'center',
    position: 'relative',
  }),
  erroredListItem: css({
    '& > div': {
      borderColor: tokens.colorRedBase,
    },
  }),
  validationTooltip: css({
    display: 'flex',
    marginRight: tokens.spacingXs,
  }),
  listItem: css({
    margin: '0',
    padding: `${tokens.spacing2Xs} 0`,
    background: 'white',
    position: 'relative',
    '&:before': {
      position: 'absolute',
      left: '-10px',
      top: tokens.spacing2Xs,
      content: '""',
      display: 'block',
      borderLeft: `1px solid ${tokens.colorElementMid}`,
      height: '1em',
      borderBottom: `1px solid ${tokens.colorElementMid}`,
      width: '20px',
    },
    '&:after': {
      position: 'absolute',
      left: '-10px',
      bottom: '20px',
      content: '""',
      display: 'block',
      borderLeft: `1px solid ${tokens.colorElementMid}`,
      height: '9999px',
      zIndex: '-1',
    },
  }),
  status: css({
    marginLeft: 'auto',
    alignSelf: 'center',
  }),
  assetIcon: css({
    marginRight: tokens.spacing2Xs,
  }),
  circularIconWrapper: css({
    display: 'flex',
  }),
  text: css({
    maxWidth: '100%',
    overflow: 'hidden',
    marginRight: tokens.spacingM,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
  }),
  contentWrapper: css({
    cursor: 'pointer',
    display: 'flex',
    width: '95%',
    alignItems: 'center',
  }),
};

const ReferenceCard = ({
  entity,
  onClick,
  isMoreCard,
  isUnresolved,
  isCircular,
  validationError,
  isReferenceSelected,
  onReferenceCheckboxClick,
}) => {
  const [title, setTitle] = useState('Untitled');
  const [isSelected, setSelected] = useState(isReferenceSelected);

  useEffect(() => {
    async function getTitle() {
      if (entity) {
        const fetchedTitle = await getEntityTitle(entity);
        setTitle(fetchedTitle || 'Untitled');
      }
    }
    if (!isUnresolved) {
      getTitle();
    }
  }, [entity, isUnresolved]);

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

  if (isUnresolved) {
    return (
      <ListItem className={styles.listItem}>
        <Card className={styles.card} onClick={noop}>
          {entity.sys.linkType === 'Asset' && (
            <Icon icon="Asset" color="muted" className={styles.assetIcon} />
          )}
          <Paragraph className={styles.text}>
            {entity.sys.linkType} is missing or inaccessible
          </Paragraph>
        </Card>
      </ListItem>
    );
  }

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
    <ListItem className={cx(styles.listItem, validationError && styles.erroredListItem)}>
      <Card className={styles.card}>
        <Checkbox
          labelText={isSelected ? 'Deselect entity' : 'Select entity'}
          onChange={() => {
            setSelected(!isSelected);
            onReferenceCheckboxClick(!isSelected, entity);
          }}
          checked={isSelected}
        />
        <div className={styles.contentWrapper} onClick={() => onClick(entity)}>
          {validationError && (
            <span data-test-id="validation-error">
              <Tooltip content={validationError} targetWrapperClassName={styles.validationTooltip}>
                <Icon icon="ErrorCircle" color="negative" />
              </Tooltip>
            </span>
          )}
          {entity.sys.type === 'Asset' && (
            <Icon icon={entity.sys.type} color="muted" className={styles.assetIcon} />
          )}
          {isCircular && (
            <span
              title="This entry has already been referenced in one of the parent entries"
              className={styles.circularIconWrapper}>
              <Icon
                testId="circular-icon"
                icon="Cycle"
                color="muted"
                className={styles.assetIcon}
              />
            </span>
          )}
          <Paragraph className={styles.text} title={title}>
            {title}
          </Paragraph>
          <EntityStatusTag
            statusLabel={EntityState.stateName(EntityState.getState(entity.sys))}
            className={styles.status}
          />
        </div>
      </Card>
    </ListItem>
  );
};

export const ReferencePropType = PropTypes.shape({
  sys: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }),
});

ReferenceCard.propTypes = {
  entity: ReferencePropType,
  isReferenceSelected: PropTypes.bool,
  onClick: PropTypes.func,
  isMoreCard: PropTypes.bool,
  isUnresolved: PropTypes.bool,
  isCircular: PropTypes.bool,
  validationError: PropTypes.string,
  onReferenceCheckboxClick: PropTypes.func,
};

ReferenceCard.defaultProps = {
  onClick: noop,
  onReferenceCheckboxClick: noop,
};

export default ReferenceCard;