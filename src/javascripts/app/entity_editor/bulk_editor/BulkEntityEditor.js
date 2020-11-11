import React, { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import AngularComponent from 'ui/Framework/AngularComponent';
import BulkEditorTitle from './BulkEditorTitle';
import BulkEntityEditorActionsDropdown from './BulkEntityEditorActionsDropdown';
import BulkEntityEditorStatusDropdown from './BulkEntityEditorStatusDropdown';
import CustomEditorExtensionRenderer from 'app/entry_editor/CustomEditorExtensionRenderer';
import * as K from 'core/utils/kefir';
import * as Navigator from 'states/Navigator';
import * as logger from 'services/logger';
import { localFieldChanges } from 'app/entity_editor/Document';
import { filterWidgets } from 'app/entry_editor/formWidgetsController';
import Loader from 'ui/Loader';
import { css } from 'emotion';
import { Workbench } from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { makeFieldLocaleListeners } from 'app/entry_editor/makeFieldLocaleListeners';
import { getEditorState } from '../editorState';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isCurrentEnvironmentMaster } from 'core/services/SpaceEnvContext/utils';
import { trackEntryView } from '../Tracking';

const styles = {
  workbench: css({
    position: 'relative',
  }),
  loadingWrapper: css({
    width: '100%',
    height: '5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  }),
};

export const BulkEntityEditor = ({
  entityContext,
  bulkEditorContext,
  onEditorInitialized,
  localeData,
  onRemove,
  hasInitialFocus,
}) => {
  const {
    currentEnvironmentId,
    currentSpace,
    currentSpaceId,
    currentSpaceContentTypes,
  } = useSpaceEnvContext();
  const isMasterEnvironment = isCurrentEnvironmentMaster(currentSpace);

  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [editorStatus, setEditorStatus] = useState({});
  const [editorState, setEditorState] = useState(null);

  const stateRef = useMemo(
    () =>
      Navigator.makeEntityRef({
        sys: {
          id: entityContext.id,
          type: 'Entry',
          environment: {
            sys: {
              id: currentEnvironmentId,
              isMasterEnvironment,
            },
          },
          space: {
            sys: { id: currentSpaceId },
          },
        },
      }),
    [entityContext.id, currentEnvironmentId, isMasterEnvironment, currentSpaceId]
  );

  const { editorSettings: preferences, track } = bulkEditorContext;

  useEffect(() => {
    const lifeline = K.createBus();
    const init = async () => {
      try {
        const editorData = await bulkEditorContext.loadEditorData(entityContext.id);

        const editorState = getEditorState({
          bulkEditorContext,
          editorData,
          environmentId: currentEnvironmentId,
          hasInitialFocus: bulkEditorContext.editorSettings.hasInitialFocus || hasInitialFocus,
          lifeline: lifeline.stream,
          onStateUpdate: (state) => setEditorStatus({ ...state }), // force state update
          onTitleUpdate: setTitle,
          currentSpaceContentTypes,
          spaceId: currentSpaceId,
          trackView: (args) =>
            trackEntryView({
              ...args,
              currentSlideLevel: 0,
              editorType: 'bulk_editor',
            }),
        });

        if (editorState) {
          const { doc } = editorState;
          const {
            entityInfo: { id },
          } = editorData;

          K.onValue(doc.resourceState.stateChange$, (data) => {
            track.changeStatus(id, data.to);
          });

          K.onValue(localFieldChanges(doc), () => {
            track.edited(id);
          });

          setEditorState(editorState);
        }
      } catch (error) {
        logger.logError(error);
      } finally {
        onEditorInitialized();
        setIsLoading(false);
      }
    };
    init();

    return () => {
      lifeline.end(); // make the doc destroy
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fieldLocaleListeners = useMemo(() => {
    if (!editorState) return null;
    const { editorData, editorContext, doc } = editorState;
    return makeFieldLocaleListeners(editorData.fieldControls.all, editorContext, localeData, doc);
  }, [editorState, localeData]);

  if (isLoading) {
    return (
      <div className={styles.loadingWrapper} data-test-id="entity-loader">
        <Loader isShown message="Loading entry" />
      </div>
    );
  }

  if (!editorState) {
    return null;
  }

  const { editorData, editorContext, doc } = editorState;
  const { entityInfo, fieldControls, customEditor } = editorData;

  const trackAction = track.actions(entityContext.id);

  const widgets = filterWidgets(
    localeData,
    editorContext,
    fieldControls.form,
    preferences.showDisabledFields
  );

  const toggleExpansion = () => {
    const expanded = !isExpanded;
    setIsExpanded(expanded);
    trackAction.setExpansion(expanded);
  };

  const openInEntryEditor = () => {
    trackAction.openInEntryEditor();
  };

  const unlink = () => {
    trackAction.unlink();
    onRemove();
  };

  const scope = {
    preferences,
    widgets,
    editorContext,
    editorData,
    entityInfo,
    localeData,
    fieldLocaleListeners,
    otDoc: doc,
  };

  return (
    <div data-test-id="entity-workbench">
      <Workbench className={styles.workbench}>
        <Workbench.Header
          icon={<ProductIcon icon="Content" size="large" />}
          title={
            <BulkEditorTitle
              onClick={toggleExpansion}
              title={title}
              isCollapsed={!isExpanded}
              entityInfo={entityInfo}
            />
          }
          actions={
            <Fragment>
              <BulkEntityEditorActionsDropdown
                openInEntryEditor={openInEntryEditor}
                stateRef={stateRef}
                unlink={unlink}
              />
              <BulkEntityEditorStatusDropdown
                inProgress={editorStatus.inProgress}
                state={editorStatus.current}
                allActions={editorStatus.allActions}
              />
            </Fragment>
          }
        />
        {isExpanded && (
          <Workbench.Content type="text">
            {customEditor ? (
              <CustomEditorExtensionRenderer extension={customEditor} scope={scope} />
            ) : (
              <AngularComponent
                with$Apply
                template={
                  '<cf-entity-field ng-repeat="widget in widgets track by widget.fieldId"></cf-entity-field>'
                }
                scope={scope}
              />
            )}
          </Workbench.Content>
        )}
      </Workbench>
    </div>
  );
};

BulkEntityEditor.propTypes = {
  entityContext: PropTypes.shape({
    id: PropTypes.string.isRequired,
    key: PropTypes.string.isRequired,
  }).isRequired,
  hasInitialFocus: PropTypes.bool,
  onRemove: PropTypes.func.isRequired,
  onEditorInitialized: PropTypes.func.isRequired,
  bulkEditorContext: PropTypes.shape({
    loadEditorData: PropTypes.func.isRequired,
    editorSettings: PropTypes.shape({
      showDisabledFields: PropTypes.bool,
      hasInitialFocus: PropTypes.bool,
    }).isRequired,
    track: PropTypes.shape({
      changeStatus: PropTypes.func.isRequired,
      edited: PropTypes.func.isRequired,
      actions: PropTypes.func.isRequired,
    }).isRequired,
  }),
  localeData: PropTypes.object.isRequired,
};
