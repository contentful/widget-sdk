import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { stateName, getState } from 'data/CMA/EntityState';
import * as EntityFieldValueSpaceContext from 'classes/EntityFieldValueSpaceContext';
import RelativeDateTime from 'components/shared/RelativeDateTime';
import { EntityStatusTag } from 'components/shared/EntityStatusTag';
import Thumbnail from 'components/Thumbnail/Thumbnail';
import { newForLocale } from 'app/entity_editor/entityHelpers';

const styles = {
  textOverflow: css({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
};

function RelativeDateFieldValue({ value }) {
  return (
    <span className={styles.textOverflow}>
      <RelativeDateTime value={value} />
    </span>
  );
}

RelativeDateFieldValue.propTypes = {
  value: PropTypes.string.isRequired,
};

const ReleaseDisplayField = ({ entity, field, defaultLocale }) => {
  const [fetchedEntityTitle, setFetchedEntityTitle] = useState('Untitled');
  const [fetchedEntityFile, setFetchedEntityFile] = useState({});

  useEffect(() => {
    async function getEntityTitle(entity, defaultLocale) {
      const fetchedEntityTitle = await newForLocale(defaultLocale).entityTitle(entity);
      setFetchedEntityTitle(fetchedEntityTitle);
    }

    async function getEntityFile(entity, defaultLocale) {
      const fetchedEntityFile = await newForLocale(defaultLocale).assetFile(entity);
      setFetchedEntityFile(fetchedEntityFile);
    }

    getEntityTitle(entity, defaultLocale);
    getEntityFile(entity, defaultLocale);
  }, [entity, defaultLocale]);

  switch (field) {
    case 'name':
      return <span>{fetchedEntityTitle || 'Untitled'}</span>;
    case 'preview':
      return <Thumbnail file={fetchedEntityFile} size="30" fit="thumb" focus="faces" />;
    case 'contentType': {
      const contentTypeData = EntityFieldValueSpaceContext.getContentTypeById(
        entity.sys.contentType.sys.id
      );
      const contentType = contentTypeData && (
        <span className={styles.textOverflow}>{contentTypeData.getName()}</span>
      );
      return contentType;
    }
    case 'added': {
      const createdAt = entity.sys.createdAt && (
        <RelativeDateFieldValue value={entity.sys.createdAt} />
      );
      return createdAt;
    }
    case 'updated': {
      const updatedAt = entity.sys.updatedAt && (
        <RelativeDateFieldValue value={entity.sys.updatedAt} />
      );
      return updatedAt;
    }
    case 'status': {
      const statusLabel = stateName(getState(entity.sys));
      return <EntityStatusTag statusLabel={statusLabel} />;
    }
    default:
      return <span></span>;
  }
};

ReleaseDisplayField.propTypes = {
  entity: PropTypes.object.isRequired,
  field: PropTypes.string.isRequired,
  defaultLocale: PropTypes.object.isRequired,
};

export default ReleaseDisplayField;
