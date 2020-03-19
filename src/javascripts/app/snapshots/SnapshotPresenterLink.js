import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { memoize } from 'lodash';
import { css } from 'emotion';
import { getModule } from 'NgRegistry';
import { Card } from '@contentful/forma-36-react-components';

import * as EntityResolver from 'data/CMA/EntityResolver';
import * as EntityHelpers from 'app/entity_editor/entityHelpers';
import EntryLink from 'app/widgets/link/EntryLink';
import AssetLink from 'app/widgets/link/AssetLink';

const styles = {
  assetLink: css({
    display: 'inline-block',
    margin: '0 10px 10px 0'
  })
};

const SnapshotPresenterLink = ({ locale, value, linkType }) => {
  const [models, setModels] = useState([]);
  const spaceContext = getModule('spaceContext');

  useEffect(() => {
    const links = Array.isArray(value) ? value : [value];
    const ids = links.map(({ sys }) => sys.id);

    EntityResolver.fetchForType(spaceContext, linkType, ids).then(results => {
      const mapped = results.reduce(
        (red, entity) => ({
          ...red,
          [entity.sys.id]: { entity }
        }),
        {}
      );
      const mappedResults = ids.map(id => mapped[id]);
      setModels(mappedResults);
    });
  }, [linkType, spaceContext, value]);

  const helper = EntityHelpers.newForLocale(locale.code);
  const getContentType = memoize(
    ({ sys }) => spaceContext.publishedCTs.fetch(sys.contentType.sys.id),
    ({ sys }) => sys.id
  );

  return models.map((model, i) => {
    if (!model) {
      return (
        <div key={`missing_${i}`} data-test-id="snapshot-presenter-link">
          <Card>Entry missing or inaccessible</Card>
        </div>
      );
    }
    const { entity } = model;
    const key = `${entity.sys.id}_${i}`;
    return entity.sys.type === 'Entry' ? (
      <div key={key} data-test-id="snapshot-presenter-link">
        <EntryLink entry={entity} entityHelpers={helper} getContentType={getContentType} />
      </div>
    ) : (
      <div key={key} className={styles.assetLink} data-test-id="snapshot-presenter-link">
        <AssetLink asset={entity} entityHelpers={helper} />
      </div>
    );
  });
};

const entityProps = PropTypes.shape({
  sys: PropTypes.shape({
    id: PropTypes.string,
    type: PropTypes.string,
    linkType: PropTypes.string
  })
});

SnapshotPresenterLink.propTypes = {
  locale: PropTypes.shape({
    code: PropTypes.string
  }).isRequired,
  value: PropTypes.oneOfType([PropTypes.arrayOf(entityProps), entityProps]),
  linkType: PropTypes.string.isRequired
};

SnapshotPresenterLink.defaultProps = {
  locale: {}
};

export default SnapshotPresenterLink;
