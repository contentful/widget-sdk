import React, { Component, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { TextLink, Icon, Notification } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { getEntityTitle } from 'app/entry_editor/EntryReferences/referencesService';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes';
import SidebarWidgetTypes from 'app/EntrySidebar/SidebarWidgetTypes';
import EntrySidebarWidget from 'app/EntrySidebar/EntrySidebarWidget';
import ReleasesTimeline from './ReleasesTimeline';
import ReleasesWidgetDialog from './ReleasesWidgetDialog';
import { getReleasesFeatureVariation } from '../ReleasesFeatureFlag';
import { replaceReleaseById } from '../releasesService';
import { ReleasesProvider, ReleasesContext } from './ReleasesContext';
import { releaseDetailNavigation } from '../ReleaseDetail/utils';
import { excludeEntityFromRelease, fetchReleases } from '../common/utils';

const styles = {
  textLink: css({
    display: 'flex',
    marginTop: tokens.spacingXs,
  }),
};

const ReleasesWidget = ({ entityInfo, entity, entityTitle }) => {
  const { state, dispatch } = useContext(ReleasesContext);
  const [isRelaseDialogShown, setIsRelaseDialogShown] = useState(false);

  useEffect(() => {
    fetchReleases(entityInfo, dispatch);
  }, [entityInfo, dispatch]);

  const onReleaseSelect = (release) => {
    releaseDetailNavigation(release);
  };

  const handleReleaseRefresh = async () => {
    fetchReleases(entityInfo, dispatch);
  };

  const deleteEntityFromRelease = (release) => {
    const releaseWithoutEntity = excludeEntityFromRelease(release, entityInfo.id);

    replaceReleaseById(release.sys.id, release.title, releaseWithoutEntity)
      .then(() => {
        handleReleaseRefresh();
        Notification.success(`${entityTitle || 'Untitled'} was removed from ${release.title}`);
      })
      .catch(() => {
        Notification.error(`Failed deleting entity`);
      });
  };

  return (
    <EntrySidebarWidget title="Releases" testId="sidebar-releases-section">
      {state.releasesIncludingEntity.length ? (
        <ReleasesTimeline
          releases={state.releasesIncludingEntity}
          onReleaseSelect={onReleaseSelect}
          deleteEntityFromRelease={deleteEntityFromRelease}
        />
      ) : null}
      <div className={styles.textLink}>
        <Icon icon="Plus" color="primary" />
        <TextLink onClick={() => setIsRelaseDialogShown(true)}>Add to Release</TextLink>
      </div>
      {isRelaseDialogShown && (
        <ReleasesWidgetDialog
          selectedEntities={[entity]}
          releaseContentTitle={entityTitle}
          rootEntity={entity}
          handleReleaseRefresh={handleReleaseRefresh}
          onCancel={() => setIsRelaseDialogShown(false)}
        />
      )}
    </EntrySidebarWidget>
  );
};

ReleasesWidget.propTypes = {
  entityInfo: PropTypes.object.isRequired,
  entity: PropTypes.object.isRequired,
  entityTitle: PropTypes.string.isRequired,
};

export default class ReleasesWidgetContainer extends Component {
  constructor(props) {
    super(props);
    this.onUpdateReleasesWidget = this.onUpdateReleasesWidget.bind(this);
  }

  static propTypes = {
    emitter: PropTypes.object.isRequired,
  };

  state = {
    featureEnabled: false,
    entityInfo: undefined,
    entity: undefined,
    entityTitle: undefined,
  };

  async componentDidMount() {
    this.props.emitter.on(SidebarEventTypes.UPDATED_RELEASES_WIDGET, this.onUpdateReleasesWidget);
    this.props.emitter.emit(SidebarEventTypes.WIDGET_REGISTERED, SidebarWidgetTypes.RELEASES);

    const featureEnabled = await getReleasesFeatureVariation();
    this.setState({ featureEnabled });
  }

  componentWillUnmount() {
    this.props.emitter.off(SidebarEventTypes.UPDATED_RELEASES_WIDGET, this.onUpdateReleasesWidget);
  }

  async onUpdateReleasesWidget({ entityInfo, entity }) {
    const entityTitle = await getEntityTitle(entity);
    this.setState({ entityInfo, entity, entityTitle });
  }

  render() {
    const { featureEnabled, entityInfo, entity, entityTitle } = this.state;

    if (!featureEnabled || !entityInfo) {
      return null;
    }

    return (
      <ReleasesProvider>
        <ReleasesWidget entityInfo={entityInfo} entity={entity} entityTitle={entityTitle} />
      </ReleasesProvider>
    );
  }
}
