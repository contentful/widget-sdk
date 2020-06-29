import React, { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { AssetCard, DropdownList, DropdownListItem } from '@contentful/forma-36-react-components';
import { stateName, getState } from 'data/CMA/EntityState';
import { ReleasesContext } from '../ReleasesWidget/ReleasesContext';
import {
  findValidationErrorForEntity,
  getEntityTitle,
  getEntityFile,
  entityNavigation,
} from './utils';

const styles = {
  assetCard: css({
    display: 'flex',
    margin: tokens.spacingM,
  }),
  erroredListItem: css({
    border: `2px solid ${tokens.colorRedBase}`,
  }),
};

const AssetEntityCard = ({ handleEntityDelete, entity, defaultLocale }) => {
  const [fetchedEntityFile, setFetchedEntityFile] = useState(null);
  const [fetchedEntityTitle, setFetchedEntityTitle] = useState('Untitled');
  const {
    state: { validations: validationErrors },
  } = useContext(ReleasesContext);

  useEffect(() => {
    getEntityTitle(entity, defaultLocale, setFetchedEntityTitle);
    getEntityFile(entity, defaultLocale, setFetchedEntityFile);
  }, [entity, defaultLocale]);

  const statusLabel = stateName(getState(entity.sys));
  const validated = findValidationErrorForEntity(entity.sys.id, validationErrors);
  return (
    <AssetCard
      testId="release-asset-card"
      className={cx(styles.assetCard, { [styles.erroredListItem]: validated })}
      onClick={() => entityNavigation(entity, 'assets', 'asset')}
      status={statusLabel}
      type={fetchedEntityFile ? 'image' : 'plaintext'}
      title={fetchedEntityTitle || 'Untitled'}
      src={fetchedEntityFile ? `${fetchedEntityFile.url}?w=150&h=150` : ''}
      size="small"
      dropdownListElements={
        <DropdownList>
          <DropdownListItem
            testId="delete-entity"
            onClick={() => {
              handleEntityDelete(entity);
            }}>
            Remove from release
          </DropdownListItem>
        </DropdownList>
      }
    />
  );
};

AssetEntityCard.propTypes = {
  defaultLocale: PropTypes.object.isRequired,
  handleEntityDelete: PropTypes.func.isRequired,
  entity: PropTypes.object.isRequired,
};

export default AssetEntityCard;
