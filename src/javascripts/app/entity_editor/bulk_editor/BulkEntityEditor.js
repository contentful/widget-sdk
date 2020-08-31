import React, { useMemo, useState, useEffect, Fragment } from 'react';
import PropTypes from 'prop-types';
import AngularComponent from 'ui/Framework/AngularComponent';
import BulkEditorTitle from './BulkEditorTitle';
import BulkEntityEditorActionsDropdown from './BulkEntityEditorActionsDropdown';
import BulkEntityEditorStatusDropdown from './BulkEntityEditorStatusDropdown';
import CustomEditorExtensionRenderer from 'app/entry_editor/CustomEditorExtensionRenderer';
import _ from 'lodash';
import * as K from 'core/utils/kefir';
import * as Navigator from 'states/Navigator';
import { makeNotify } from 'app/entity_editor/Notifications';
import { truncate } from 'utils/StringUtils';
import * as Focus from 'app/entity_editor/Focus';
import * as logger from 'services/logger';
import localeStore from 'services/localeStore';
import { trackEntryView } from 'app/entity_editor/Tracking';
import { localFieldChanges, valuePropertyAt } from 'app/entity_editor/Document';

import setupNoShareJsCmaFakeRequestsExperiment from 'app/entity_editor/NoShareJsCmaFakeRequestsExperiment';
import { initDocErrorHandlerWithoutScope } from 'app/entity_editor/DocumentErrorHandler';
import * as Validator from 'app/entity_editor/Validator';
import { buildFieldsApi } from 'app/entity_editor/dataFields';
import * as EntityFieldValueSpaceContext from 'classes/EntityFieldValueSpaceContext';

import { initStateController } from '../stateController';
import { getModule } from 'core/NgRegistry';
import { filterWidgets } from 'app/entry_editor/formWidgetsController';
import { createExtensionBridgeAdapter } from 'widgets/bridges/createExtensionBridgeAdapter';
import Loader from 'ui/Loader';
import { css } from 'emotion';
import { Workbench } from '@contentful/forma-36-react-components';
import { NavigationIcon } from '@contentful/forma-36-react-components/dist/alpha';

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

const fetchEditorState = async (
  bulkEditorContext,
  entityContext,
  spaceContext,
  hasInitialFocus
) => {
  const editorData = await bulkEditorContext.loadEditorData(entityContext.id);

  if (editorData) {
    const otDoc = editorData.openDoc(K.createBus().stream);
    // We wait for the document to be opened until we setup the editor
    await new Promise((resolve) => {
      otDoc.state.loaded$.onValue((loaded) => loaded && resolve());
    });

    const { entityInfo } = editorData;

    const validator = Validator.createForEntry(
      entityInfo.contentType,
      otDoc,
      spaceContext.publishedCTs,
      localeStore.getPrivateLocales()
    );

    return {
      editorData,
      otDoc,
      editorContext: {
        entityInfo,
        validator,
        focus: Focus.create(),
        hasInitialFocus: bulkEditorContext.editorSettings.hasInitialFocus || hasInitialFocus,
      },
    };
  }
};

export const BulkEntityEditor = ({
  entityContext,
  bulkEditorContext,
  onEditorInitialized,
  localeData,
  onRemove,
  hasInitialFocus,
}) => {
  const spaceContext = useMemo(() => getModule('spaceContext'), []);

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
              id: spaceContext.getEnvironmentId(),
              isMasterEnvironment: spaceContext.isMasterEnvironment(),
            },
          },
          space: {
            sys: { id: spaceContext.getId() },
          },
        },
      }),
    [entityContext.id, spaceContext]
  );

  const { editorSettings: preferences, track } = bulkEditorContext;

  useEffect(() => {
    const init = async () => {
      try {
        const editorState = await fetchEditorState(
          bulkEditorContext,
          entityContext,
          spaceContext,
          hasInitialFocus
        );
        if (editorState) {
          const { editorData, editorContext, otDoc } = editorState;
          const { entityInfo, entity } = editorData;
          const { validator } = editorContext;

          initDocErrorHandlerWithoutScope(otDoc.state.error$);

          initStateController({
            bulkEditorContext,
            editorData,
            entity,
            entityInfo,
            notify: makeNotify('Entry', () => `“${title}”`),
            onUpdate: (state) => setEditorStatus({ ...state }), // force state update
            otDoc,
            spaceContext,
            validator,
          });

          K.onValue(otDoc.resourceState.stateChange$, (data) => {
            track.changeStatus(entityInfo.id, data.to);
          });

          K.onValue(localFieldChanges(otDoc), () => {
            track.edited(entityInfo.id);
          });

          K.onValue(valuePropertyAt(otDoc, []), (data) => {
            const title = EntityFieldValueSpaceContext.entryTitle({
              getContentTypeId: _.constant(entityInfo.contentTypeId),
              data,
            });
            setTitle(truncate(title, 50));
          });

          setupNoShareJsCmaFakeRequestsExperiment({
            spaceContext,
            otDoc,
            entityInfo,
          });

          setEditorState(editorState);

          trackEntryView({
            editorData,
            entityInfo,
            currentSlideLevel: 0,
            locale: localeStore.getDefaultLocale().internal_code,
            editorType: 'bulk_editor',
          });
        }
      } catch (error) {
        logger.logError(error);
      } finally {
        onEditorInitialized();
        setIsLoading(false);
      }
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const { editorData, editorContext, otDoc } = editorState;
  const { entityInfo, fieldControls, customEditor } = editorData;

  const trackAction = track.actions(entityContext.id);

  const { widgets } = filterWidgets(
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

  const fields = buildFieldsApi(entityInfo.contentType.fields, otDoc);
  const scope = {
    preferences,
    widgets,
    editorContext,
    editorData,
    entityInfo,
    fields,
    localeData,
    otDoc,
  };

  return (
    <div data-test-id="entity-workbench">
      <Workbench className={styles.workbench}>
        <Workbench.Header
          icon={<NavigationIcon icon="Content" size="large" />}
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
              <CustomEditorExtensionRenderer
                extension={customEditor}
                createBridge={createExtensionBridgeAdapter(scope)}
              />
            ) : (
              <AngularComponent
                with$Apply
                template={`<cf-entity-field ng-repeat="widget in widgets track by widget.fieldId"></cf-entity-field>`}
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
