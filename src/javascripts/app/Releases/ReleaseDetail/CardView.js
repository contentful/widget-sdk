import React, { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import LoadingState from 'app/common/LoadingState';
import * as EntityFieldValueSpaceContext from 'classes/EntityFieldValueSpaceContext';
import { ReleasesContext } from '../ReleasesWidget/ReleasesContext';
import EntityTimeline from './EntityTimeline';

const styles = {
  cardView: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  }),
  loading: css({
    margin: '30vh auto 0',
  }),
};

const CardView = ({ handleEntityDelete, defaultLocale }) => {
  const [groupedEntries, setGroupedEntries] = useState(null);
  const {
    state: {
      entities: { entries, assets },
      loading: isLoading,
    },
  } = useContext(ReleasesContext);

  const contentTypeName = (contentTypeId) => {
    const contentTypeData = EntityFieldValueSpaceContext.getContentTypeById(contentTypeId);
    return contentTypeData ? contentTypeData.getName() : null;
  };

  useEffect(() => {
    function getEntriesByContentType() {
      const entriesByContentType = entries.reduce((acc, entry) => {
        const {
          sys: { id: contentTypeId },
        } = entry.sys.contentType;
        acc[contentTypeName(contentTypeId)] = (acc[contentTypeName(contentTypeId)] || []).concat(
          entry
        );
        return acc;
      }, {});

      setGroupedEntries(entriesByContentType);
    }
    getEntriesByContentType();
  }, [entries]);

  return (
    <div className={styles.cardView} data-test-id="release-detail-card-view">
      {isLoading ? (
        <div className={styles.loading}>
          <LoadingState loadingText="Loading Entities..." />
        </div>
      ) : (
        <>
          {groupedEntries
            ? Object.keys(groupedEntries)
                .sort()
                .map((ct, index) => (
                  <EntityTimeline
                    key={`${ct}_${index}`}
                    contentType={ct}
                    entityType="Entry"
                    handleEntityDelete={handleEntityDelete}
                    groupedEntities={groupedEntries[ct]}
                    defaultLocale={defaultLocale}
                  />
                ))
            : null}
          {assets.length ? (
            <EntityTimeline
              key={'asset'}
              contentType={'Assets'}
              entityType="Asset"
              handleEntityDelete={handleEntityDelete}
              groupedEntities={assets}
              defaultLocale={defaultLocale}
            />
          ) : null}
        </>
      )}
    </div>
  );
};

CardView.propTypes = {
  defaultLocale: PropTypes.object.isRequired,
  handleEntityDelete: PropTypes.func.isRequired,
};

export default CardView;
