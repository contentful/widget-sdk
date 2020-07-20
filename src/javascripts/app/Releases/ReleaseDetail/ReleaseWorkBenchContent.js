import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { cx } from 'emotion';
import { Workbench, Subheading } from '@contentful/forma-36-react-components';
import FilterPill from 'app/ContentList/Search/FilterPill';
import ValueInput from 'app/ContentList/Search/FilterValueInputs';
import { ReleasesContext } from '../ReleasesWidget/ReleasesContext';
import ReleasesEmptyStateMessage from '../ReleasesPage/ReleasesEmptyStateMessage';
import { VIEW_LABELS, pluralize } from './utils';
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

  return (
    <Workbench.Content
      className={cx(styles.mainContent, {
        [styles.mainContentListView]: activeLayout('list'),
      })}>
      {!isLoading && !release.entities.items.length ? (
        <ReleasesEmptyStateMessage testId="detail" title="No entities in this release" />
      ) : (
        <>
          <div
            className={cx(styles.layoutPillsWrapper, {
              [styles.layoutList]: activeLayout('list'),
            })}>
            <div className={styles.header}>
              <Subheading element="h2">Content</Subheading>
              <span className={cx({ [styles.hideDisplay]: activeLayout('list') })}>
                {entries.length} {pluralize(entries.length, 'entry')} and {assets.length}{' '}
                {pluralize(assets.length, 'asset')}
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
