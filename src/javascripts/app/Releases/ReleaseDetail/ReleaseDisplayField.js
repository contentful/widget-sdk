import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { Tooltip, Icon } from '@contentful/forma-36-react-components';
import { stateName, getState } from 'data/CMA/EntityState';
import * as EntityFieldValueSpaceContext from 'classes/EntityFieldValueSpaceContext';
import RelativeDateTime from 'components/shared/RelativeDateTime';
import { EntityStatusTag } from 'components/shared/EntityStatusTag';
import { Thumbnail } from '@contentful/field-editor-file';
import tokens from '@contentful/forma-36-tokens';
import { getEntityFile, getEntityTitle } from './utils';
import { getExternalImageUrl } from 'utils/thumbnailHelpers';

const styles = {
  textOverflow: css({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  nameWrapper: css({
    display: 'flex',
  }),
  validationTooltip: css({
    display: 'flex',
    marginRight: tokens.spacingXs,
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

const ReleaseDisplayField = ({ entity, field, defaultLocale, validationError }) => {
  const [fetchedEntityTitle, setFetchedEntityTitle] = useState('Untitled');
  const [fetchedEntityFile, setFetchedEntityFile] = useState({});

  useEffect(() => {
    getEntityTitle(entity, defaultLocale, setFetchedEntityTitle);
    getEntityFile(entity, defaultLocale, setFetchedEntityFile);
  }, [entity, defaultLocale]);

  switch (field) {
    case 'name': {
      return (
        <div className={styles.nameWrapper}>
          {validationError && (
            <span data-test-id="validation-error">
              <Tooltip content={validationError} targetWrapperClassName={styles.validationTooltip}>
                <Icon icon="ErrorCircle" color="negative" />
              </Tooltip>
            </span>
          )}
          <span>{fetchedEntityTitle || 'Untitled'}</span>
        </div>
      );
    }
    case 'preview': {
      return fetchedEntityFile ? (
        <Thumbnail
          file={fetchedEntityFile}
          getExternalImageUrl={getExternalImageUrl}
          size="30"
          fit="thumb"
          focus="faces"
        />
      ) : null;
    }
    case 'contentType': {
      const contentTypeData = EntityFieldValueSpaceContext.getContentTypeById(
        entity.sys.contentType.sys.id
      );
      const contentType = contentTypeData ? (
        <span className={styles.textOverflow}>{contentTypeData.getName()}</span>
      ) : null;
      return contentType;
    }
    case 'added': {
      const createdAt = entity.sys.createdAt ? (
        <RelativeDateFieldValue value={entity.sys.createdAt} />
      ) : null;
      return createdAt;
    }
    case 'updated': {
      const updatedAt = entity.sys.updatedAt ? (
        <RelativeDateFieldValue value={entity.sys.updatedAt} />
      ) : null;
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
  validationError: PropTypes.string,
};

export default ReleaseDisplayField;
