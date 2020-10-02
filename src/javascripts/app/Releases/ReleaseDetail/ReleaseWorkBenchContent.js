import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { cx } from 'emotion';
import pluralize from 'pluralize';
import { Workbench, Subheading } from '@contentful/forma-36-react-components';
import { FilterPill } from 'features/entity-search';
import { FilterValueInputs as ValueInput } from 'core/services/ContentQuery';
import { ReleasesContext } from '../ReleasesWidget/ReleasesContext';
import ReleasesEmptyStateMessage from '../ReleasesPage/ReleasesEmptyStateMessage';
import { VIEW_LABELS } from './utils';
import ListView from './ListView';
import CardView from './CardView';
import { styles } from './styles';

const ReleaseWorkBenchContent = ({
  activeLayout,
  release,
  entitiesLayout,
  setEntitiesLayout,
  handleEntityDelete,
  defaultLocale,
}) => {
  const {
    state: {
      entities: { entries, assets },
      loading: isLoading,
    },
  } = useContext(ReleasesContext);

  const entityStats = [];
  if (entries.length) {
    entityStats.push(pluralize('entry', entries.length, true));
  }
  if (assets.length) {
    entityStats.push(pluralize('asset', assets.length, true));
  }

  return (
    <Workbench.Content
      className={cx(styles.mainContent, {
        [styles.mainContentListView]: activeLayout('list'),
      })}>
      {!isLoading && !release.entities.items.length ? (
        <ReleasesEmptyStateMessage testId="detail" title="No content in this release" />
      ) : (
        <>
          <div
            className={cx(styles.layoutPillsWrapper, {
              [styles.layoutList]: activeLayout('list'),
            })}>
            <div className={styles.header}>
              <Subheading element="h2">Content</Subheading>
              <span className={cx({ [styles.hideDisplay]: activeLayout('list') })}>
                {entityStats.length ? entityStats.join(', ') : 'No content'}
              </span>
            </div>
            <FilterPill
              className={styles.layoutPills}
              filter={{
                label: 'View',
                valueInput: ValueInput.Select(
                  Object.keys(VIEW_LABELS).map((key) => [key, VIEW_LABELS[key]])
                ),
              }}
              value={entitiesLayout}
              onChange={setEntitiesLayout}
            />
          </div>

          {activeLayout('list') ? (
            <ListView defaultLocale={defaultLocale} handleEntityDelete={handleEntityDelete} />
          ) : (
            <CardView handleEntityDelete={handleEntityDelete} defaultLocale={defaultLocale} />
          )}
        </>
      )}
    </Workbench.Content>
  );
};

ReleaseWorkBenchContent.propTypes = {
  defaultLocale: PropTypes.object.isRequired,
  activeLayout: PropTypes.func.isRequired,
  release: PropTypes.object,
  entitiesLayout: PropTypes.string.isRequired,
  setEntitiesLayout: PropTypes.func.isRequired,
  handleEntityDelete: PropTypes.func.isRequired,
};

export default ReleaseWorkBenchContent;
