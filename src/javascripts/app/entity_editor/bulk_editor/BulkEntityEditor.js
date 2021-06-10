import React, { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import BulkEditorTitle from './BulkEditorTitle';
import BulkEntityEditorActionsDropdown from './BulkEntityEditorActionsDropdown';
import BulkEntityEditorStatusDropdown from './BulkEntityEditorStatusDropdown';
import CustomEditorExtensionRenderer from 'app/entry_editor/CustomEditorExtensionRenderer';
import * as K from 'core/utils/kefir';
import * as Navigator from 'states/Navigator';
import { localFieldChanges, Validator } from '@contentful/editorial-primitives';
import { captureError } from 'core/monitoring';
import { filterWidgets } from 'app/entry_editor/formWidgetsController';
import Loader from 'ui/Loader';
import { css } from 'emotion';
import { Workbench } from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { makeFieldLocaleListeners } from 'app/entry_editor/makeFieldLocaleListeners';
import { getEditorState } from '../editorState';
import { useSpaceEnvContext, useSpaceEnvContentTypes } from 'core/services/SpaceEnvContext';
import { isCurrentEnvironmentMaster } from 'core/services/SpaceEnvContext/utils';
import { trackEntryView } from '../Tracking';
import { EntityField } from '../EntityField/EntityField';
import { getBatchingApiClient } from 'app/widgets/WidgetApi/BatchingApiClient';
import { useCurrentSpaceAPIClient } from 'core/services/APIClient/useCurrentSpaceAPIClient';
import LocaleStore from 'services/localeStore';
import * as PublicContentType from 'widgets/PublicContentType';
import { createCmaDocumentWithApiNames } from 'app/widgets/ExtensionSDKs/createCmaDocumentWithApiNames';

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
  const { currentEnvironmentId, currentSpace, currentSpaceId } = useSpaceEnvContext();
  const { currentSpaceContentTypes } = useSpaceEnvContentTypes();
  const { client: cma } = useCurrentSpaceAPIClient();
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

  const lifeline = K.useLifeline();

  useEffect(() => {
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
          contentTypes: currentSpaceContentTypes,
          spaceId: currentSpaceId,
          trackView: (args) =>
            trackEntryView({
              ...args,
              currentSlideLevel: 0,
              editorType: 'bulk_editor',
              cma: getBatchingApiClient(cma),
              publishedCTs: currentSpaceContentTypes,
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
        captureError(error);
      } finally {
        onEditorInitialized();
        setIsLoading(false);
      }
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { privateLocales, defaultLocale } = localeData;

  const validator = useMemo(() => {
    if (!editorState) {
      return null;
    }
    const { editorContext, doc } = editorState;
    const contentTypeProps = currentSpaceContentTypes.find(
      (contentType) => contentType.sys.id === editorContext.entityInfo.contentType?.sys.id
    );

    if (contentTypeProps) {
      return Validator.createForEntry({
        contentType: PublicContentType.fromInternal(contentTypeProps),
        doc: createCmaDocumentWithApiNames(doc, contentTypeProps),
        locales: LocaleStore.getLocales(),
        getContentType: (id) => {
          const foundContentType = currentSpaceContentTypes.find(
            (contentType) => contentType.sys.id === id
          );
          return PublicContentType.fromInternal(foundContentType);
        },
      });
    }
  }, [currentSpaceContentTypes, editorState]);

  const fieldLocaleListeners = useMemo(() => {
    if (!editorState) {
      return null;
    }
    const { editorData, editorContext, doc } = editorState;
    return makeFieldLocaleListeners(
      editorData.fieldControls.all,
      editorContext,
      privateLocales,
      defaultLocale,
      doc
    );
  }, [defaultLocale, editorState, privateLocales]);

  if (isLoading) {
    return (
      <div className={styles.loadingWrapper} data-test-id="entity-loader">
        <Loader isShown />
      </div>
    );
  }

  if (!editorState || !validator) {
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
              <CustomEditorExtensionRenderer
                validator={validator}
                extension={customEditor}
                scope={scope}
              />
            ) : (
              widgets.map((widget, index) => (
                <EntityField
                  key={widget.fieldId}
                  doc={doc}
                  editorContext={editorContext}
                  editorData={editorData}
                  fieldLocaleListeners={fieldLocaleListeners}
                  index={index}
                  localeData={localeData}
                  preferences={preferences}
                  widget={widget}
                />
              ))
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
