import React, { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Icon, Tooltip, Card } from '@contentful/forma-36-react-components';
import { stateName, getState } from 'data/CMA/EntityState';
import { EntityStatusTag } from 'components/shared/EntityStatusTag';
import { ReleasesContext } from '../ReleasesWidget/ReleasesContext';
import DropdownContainer from './shared/DropdownContainer';
import { findValidationErrorForEntity, getEntityTitle, entityNavigation } from './utils';

const styles = {
  card: css({
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    padding: 0,
    paddingLeft: tokens.spacingXs,
  }),
  erroredListItem: css({
    border: `2px solid ${tokens.colorRedBase}`,
  }),
  validationTooltip: css({
    display: 'flex',
    marginRight: tokens.spacingXs,
  }),
  headingContainer: css({
    display: 'flex',
    width: '80%',
  }),
};

const EntryEntityCard = ({ handleEntityDelete, entity, defaultLocale, entityKey }) => {
  const [fetchedEntityTitle, setFetchedEntityTitle] = useState('Untitled');
  const {
    state: { validations: validationErrors },
  } = useContext(ReleasesContext);

  useEffect(() => {
    getEntityTitle(entity, defaultLocale, setFetchedEntityTitle);
  }, [entity, defaultLocale]);

  const statusLabel = stateName(getState(entity.sys));
  const validated = findValidationErrorForEntity(entity.sys.id, validationErrors);
  return (
    <div>
      <Card
        testId="release-entry-card"
        onClick={() => entityNavigation(entity, 'entries', 'entry')}
        className={cx(styles.card, { [styles.erroredListItem]: validated })}>
        <div className={styles.headingContainer}>
          {validated && (
            <span data-test-id="validation-error">
              <Tooltip content={validated} targetWrapperClassName={styles.validationTooltip}>
                <Icon icon="ErrorCircle" color="negative" />
              </Tooltip>
            </span>
          )}
          <span>{fetchedEntityTitle || 'Untitled'}</span>
        </div>
        <div>
          <EntityStatusTag statusLabel={statusLabel} />
          <DropdownContainer
            id={`entry_${entity.sys.id}_${entityKey}`}
            handleEntityDelete={handleEntityDelete}
            entity={entity}
          />
        </div>
      </Card>
    </div>
  );
};

EntryEntityCard.propTypes = {
  defaultLocale: PropTypes.object.isRequired,
  handleEntityDelete: PropTypes.func.isRequired,
  entity: PropTypes.object.isRequired,
  entityKey: PropTypes.string,
};

export default EntryEntityCard;
