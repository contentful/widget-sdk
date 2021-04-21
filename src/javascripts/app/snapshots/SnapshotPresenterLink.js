import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import { css } from 'emotion';
import { Card } from '@contentful/forma-36-react-components';
import TheLocaleStore from 'services/localeStore';
import * as PublicContentType from 'widgets/PublicContentType';
import { WrappedEntryCard, WrappedAssetCard } from '@contentful/field-editor-reference';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';

import * as EntityResolver from 'data/CMA/EntityResolver';

const styles = {
  assetLink: css({
    display: 'inline-block',
    margin: '0 10px 10px 0',
  }),
};

const SnapshotPresenterLink = ({ locale, value, linkType }) => {
  const [models, setModels] = useState([]);
  const { currentSpaceContentTypes } = useSpaceEnvContext();
  const defaultLocaleCode = TheLocaleStore.getDefaultLocale().code;

  useEffect(() => {
    const links = Array.isArray(value) ? value : [value];
    const ids = links.map(({ sys }) => sys.id);

    EntityResolver.fetchForType(linkType, ids).then((results) => {
      const mapped = results.reduce(
        (red, entity) => ({
          ...red,
          [entity.sys.id]: {
            entity,
          },
        }),
        {}
      );
      const mappedResults = ids.map((id) => mapped[id]);
      setModels(mappedResults);
    });
  }, [linkType, value]);

  return (
    <>
      {models.map((model, i) => {
        if (!model) {
          return (
            <div key={`missing_${i}`} data-test-id="snapshot-presenter-link">
              <Card>Entry missing or inaccessible</Card>
            </div>
          );
        }
        const { entity } = model;
        const key = `${entity.sys.id}_${i}`;

        const internalContentType = currentSpaceContentTypes.find(
          (ct) => ct.sys.id === get(entity, ['sys', 'contentType', 'sys', 'id'])
        );

        const contentType = internalContentType
          ? PublicContentType.fromInternal(internalContentType)
          : undefined;

        return entity.sys.type === 'Entry' ? (
          <div key={key} data-test-id="snapshot-presenter-link">
            <WrappedEntryCard
              getEntityScheduledActions={() => {
                return Promise.resolve([]);
              }}
              contentType={contentType}
              entry={entity}
              isDisabled={true}
              localeCode={locale.code}
              defaultLocaleCode={defaultLocaleCode}
              hasCardEditActions={false}
            />
          </div>
        ) : (
          <div key={key} className={styles.assetLink} data-test-id="snapshot-presenter-link">
            <WrappedAssetCard
              getEntityScheduledActions={() => {
                return Promise.resolve([]);
              }}
              asset={entity}
              isDisabled={true}
              localeCode={locale.code}
              defaultLocaleCode={defaultLocaleCode}
              hasCardEditActions={false}
            />
          </div>
        );
      })}
    </>
  );
};

const entityProps = PropTypes.shape({
  sys: PropTypes.shape({
    id: PropTypes.string,
    type: PropTypes.string,
    linkType: PropTypes.string,
  }),
});

SnapshotPresenterLink.propTypes = {
  locale: PropTypes.shape({
    code: PropTypes.string,
  }).isRequired,
  value: PropTypes.oneOfType([PropTypes.arrayOf(entityProps), entityProps]),
  linkType: PropTypes.string.isRequired,
};

SnapshotPresenterLink.defaultProps = {
  locale: {},
};

export default SnapshotPresenterLink;
