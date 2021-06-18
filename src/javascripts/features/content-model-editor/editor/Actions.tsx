import React, { Reducer, useEffect, useReducer, useState } from 'react';
import _ from 'lodash';
import validation from '@contentful/validation';
import { ModalConfirm, ModalLauncher, Paragraph } from '@contentful/forma-36-react-components';
import ReloadNotification from 'app/common/ReloadNotification';
import * as notify from './Notifications';
import { trackAddedField, trackEnforcedButtonClick } from './Analytics';
import { allFieldsInactive, getWidget } from './Utils';
import * as accessChecker from 'access_control/AccessChecker';
import assureDisplayField from 'data/ContentTypeRepo/assureDisplayField';
import { captureWarning } from 'core/monitoring';
import * as EditorInterfaceTransformer from 'widgets/EditorInterfaceTransformer';
import { ContentTypeForbiddenRemoval } from './Dialogs/ContenTypeForbiddenRemoval';
import { DeleteContentTypeDialog } from './Dialogs/DeleteContentTypeDialog';
import { getContentPreview } from 'features/content-preview';
import { createCommand } from 'utils/command/command';
import { isDraft, isPublished } from 'contentful-management';
import { getUpdatedField, openFieldModalDialog } from 'features/content-model-editor';
import { openDisallowDialog, openOmitDialog, openSaveDialog } from './FieldsTab/FieldTabDialogs';
import { AddFieldDialogModal } from './Dialogs/AddField';
import { useSpaceEnvContext, useSpaceEnvContentTypes } from 'core/services/SpaceEnvContext';
import { getSpaceEnvCMAClient } from 'core/services/usePlainCMAClient';
import type { ActionsState, ReducerAction } from './ActionsReducer';
import { initActionsReducer, reducer, reducerActions } from './ActionsReducer';
import { useUnsavedChangesModal } from 'core/hooks';
import { AdvancedExtensibilityFeature } from 'features/extensions-management';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { LegacyWidget, toLegacyWidget } from 'widgets/WidgetCompat';
import { getSpaceContext } from 'classes/spaceContext';
import { openDuplicateContentTypeDialog, openEditContentTypeDialog } from './Dialogs';
import { errorMessageBuilder } from '@contentful/editorial-primitives';
import { checkComposeIsInstalled } from 'features/assembly-types';
import { ASSEMBLY_TYPES, getAlphaHeader } from 'alphaHeaders';
import { router, useRouteNavigate } from 'core/react-routing';
import { TABS } from './EditorFieldTabs';
import { useContentTypeTracking } from '../tracking';

export function useCreateActions(props: { isNew?: boolean; contentTypeId?: string }) {
  const navigate = useRouteNavigate();
  const { registerSaveAction, setDirty } = useUnsavedChangesModal();
  const [hasAdvancedExtensibility, setAdvancedExtensibility] = useState(false);
  const [extensions, setExtensions] = useState<LegacyWidget[]>([]);
  const [state, dispatch] = useReducer<Reducer<ActionsState, ReducerAction>>(
    reducer,
    initActionsReducer({
      isNew: props.isNew || false,
      editorInterface: {},
      contentTypeData: {},
    })
  );
  // TODO: remove 'spaceContext'
  const spaceContext = getSpaceContext();

  const spaceEnvContext = useSpaceEnvContext();
  const { currentSpaceContentTypes } = useSpaceEnvContentTypes();
  const { fieldsUpdated } = useContentTypeTracking(spaceEnvContext);
  const { currentSpace, currentOrganizationId } = spaceEnvContext;

  const contentTypeIds = currentSpaceContentTypes.map((ct) => ct.sys.id);

  const goToDetails = (contentType) => {
    return navigate({
      path: 'content_types.detail',
      contentTypeId: contentType.sys.id,
      tab: TABS.fields,
    });
  };

  const setContextDirty = (dirty) => {
    setDirty(dirty);
    dispatch({ type: reducerActions.SET_CONTEXT_STATE_DIRTY, payload: { dirty } });
  };

  const setContentType = (contentType) => {
    dispatch({ type: reducerActions.SET_CONTENT_TYPE, payload: { contentType } });
  };

  const setEditorInterface = (editorInterface) => {
    dispatch({ type: reducerActions.UPDATE_EDITOR_INTERFACE, payload: { editorInterface } });
  };

  useEffect(() => {
    async function initContentType() {
      if (!currentSpace) return;

      const contentTypeWithData = props.contentTypeId
        ? await currentSpace.getContentType(props.contentTypeId)
        : await currentSpace.newContentType({
            sys: { type: 'ContentType' },
            fields: [],
          });
      const contentType = contentTypeWithData.data;
      const editorInterfaceFromApi = await spaceContext.cma.getEditorInterface(contentType.sys.id);
      const editorInterface = EditorInterfaceTransformer.fromAPI(
        contentType,
        editorInterfaceFromApi
      );
      const advancedExtensibility = await AdvancedExtensibilityFeature.isEnabled(
        currentOrganizationId
      );
      const loader = await getCustomWidgetLoader();
      const widgets = await loader.getUncachedForListing();
      const extensions = widgets.map(toLegacyWidget);
      setExtensions(extensions);
      setAdvancedExtensibility(advancedExtensibility);
      setEditorInterface(editorInterface);
      setContentType(contentType);
    }

    initContentType();
    // We only need to get this information once - of content type ID is changed,
    // it means the whole page is re-rendered anyway
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSpace]);

  const updateFields = (fields) => {
    dispatch({ type: reducerActions.UPDATE_FIELDS, payload: { fields } });
  };

  const openFieldDialog = (field) => {
    const fieldId = field.apiName || field.id;
    const widget =
      (state.editorInterface.controls || []).find((control) => {
        return control.fieldId === fieldId;
      }) || getWidget(field, state.contentType, state.editorInterface.controls);

    const updateWidgetSettings = (widget, field) => {
      const updatedControl = {
        field,
        fieldId: field.apiName,
        settings: widget.params,
        widgetId: widget.id,
        widgetNamespace: widget.namespace,
      };
      const controls = state.editorInterface.controls?.some(
        (control) => control.fieldId === field.apiName
      )
        ? state.editorInterface.controls.map((control) => {
            if (control.fieldId === field.apiName) {
              return updatedControl;
            }
            return control;
          })
        : [...(state.editorInterface.controls || []), updatedControl];

      dispatch({
        type: reducerActions.UPDATE_EDITOR_INTERFACE,
        payload: {
          editorInterface: { ...state.editorInterface, controls },
        },
      });
    };

    const onFieldUpdate = (...updatedFieldOptions) => {
      // use updated data to generate a new field object with `getUpdatedField`
      const { updatedField, widgetSettings } = getUpdatedField(
        updatedFieldOptions,
        field,
        state.contentType
      );

      const updatedCTfields = state.contentType.fields.find((field) => field.id === updatedField.id)
        ? state.contentType.fields.map((field) =>
            field.id === updatedField.id ? updatedField : field
          )
        : state.contentType.fields.concat([updatedField]);

      updateFields(updatedCTfields);
      updateWidgetSettings(widgetSettings, updatedField);
      setContextDirty(true);
    };

    return openFieldModalDialog(
      field,
      widget,
      state.contentType,
      onFieldUpdate,
      state.editorInterface,
      extensions
    );
  };

  const updateField = (id, update) => {
    const updatedFields = state.contentType.fields.map((field) => {
      if (field.id === id) {
        return {
          ...field,
          ...update,
        };
      }
      return field;
    });
    updateFields(updatedFields);
    setContextDirty(true);
  };

  const undeleteField = (field) => {
    updateField(field.id, {
      deleted: false,
    });
    setContextDirty(true);
  };

  const updateOrder = (fields) => {
    updateFields(fields);
    setContextDirty(true);
  };

  const setFieldAsTitle = (field) => {
    dispatch({ type: reducerActions.SET_FIELD_AS_TITLE, payload: { field } });
  };

  const toggleFieldProperty = (field, property, isTitle) => {
    const toggled = !field[property];

    if (isTitle && toggled) {
      openDisallowDialog({ field, action: 'disable' });
    } else {
      updateField(field.id, {
        [property]: toggled,
      });
      setContextDirty(true);
    }
  };

  const removeField = async (id) => {
    dispatch({ type: reducerActions.REMOVE_FIELD, payload: { id } });
    setContextDirty(true);
  };

  const addField = async (newField) => {
    dispatch({ type: reducerActions.ADD_FIELD, payload: { field: newField } });
    trackAddedField(state.contentType, newField);
    setContextDirty(true);
  };

  const showNewFieldDialog = createCommand(
    async () => {
      const existingApiNames = state.contentType.fields.map(({ apiName }) => apiName || null);
      ModalLauncher.open(({ isShown, onClose }) => (
        <AddFieldDialogModal
          isShown={isShown}
          onClose={onClose}
          onConfirm={addField}
          onConfirmAndConfigure={(field) => {
            addField(field);
            openFieldDialog(field);
          }}
          existingApiNames={existingApiNames}
        />
      ));
    },
    {
      disabled: function () {
        return (accessChecker.shouldDisable('update', 'contentType') ||
          accessChecker.shouldDisable('publish', 'contentType')) as boolean;
      },
    }
  );

  const checkRemovable = async () => {
    const isPublishedCT = isPublished(state.contentType);
    const canRead = accessChecker.canPerformActionOnEntryOfType('read', state.contentType.sys.id);
    try {
      if (!isPublishedCT || !currentSpace) {
        return Promise.resolve(createStatusObject(true));
      }
      const res = await currentSpace.getEntries({
        content_type: state.contentType.sys.id,
        limit: 0,
      });

      const count = res.total;
      return createStatusObject(canRead && count < 1, count);
    } catch (err) {
      if (err.statusCode === 404 && !canRead) {
        return createStatusObject(false);
      } else {
        return Promise.reject(err);
      }
    }

    function createStatusObject(isRemovable, entryCount = 0) {
      return {
        isPublished: isPublishedCT,
        isRemovable,
        entryCount,
      };
    }
  };

  const startDeleteFlow = async () => {
    try {
      const status = await checkRemovable();
      if (status.isRemovable) {
        return confirmRemoval(status.isPublished);
      } else {
        forbidRemoval(status.entryCount);
      }
    } catch (error) {
      ReloadNotification.basicErrorHandler();
    }
  };

  const deleteContentType = createCommand(startDeleteFlow, {
    available: function () {
      const deletableState = !state.contextState.isNew;
      const denied =
        accessChecker.shouldHide('delete', 'contentType') ||
        accessChecker.shouldHide('unpublish', 'contentType');
      return deletableState && !denied;
    },
    disabled: function () {
      return (
        accessChecker.shouldDisable('delete', 'contentType') ||
        accessChecker.shouldDisable('unpublish', 'contentType')
      );
    },
  });

  const unpublish = async () => {
    try {
      await spaceContext.publishedCTs.unpublish(state.contentType);
    } catch (error) {
      captureWarning(error);
    }
  };

  const sendDeleteRequest = async () => {
    try {
      const cmaClient = getSpaceEnvCMAClient();
      await cmaClient.contentType.delete({ contentTypeId: state.contentType.sys.id });
      notify.deleteSuccess();
      navigate({ path: 'content_types.list' });
    } catch (error) {
      notify.deleteFail(error);
    }
  };

  const remove = async (isPublished) => {
    await (isPublished ? unpublish() : Promise.resolve());
    return sendDeleteRequest();
  };

  function forbidRemoval(count) {
    return ModalLauncher.open(({ isShown, onClose }) => (
      <ContentTypeForbiddenRemoval
        isShown={isShown}
        onClose={onClose}
        entriesCount={count}
        contentTypeName={state.contentType.name}
      />
    ));
  }

  function confirmRemoval(isPublished) {
    const key = Date.now();
    return ModalLauncher.open(({ isShown, onClose }) => (
      <DeleteContentTypeDialog
        key={key}
        contentTypeName={state.contentType.name}
        isShown={isShown}
        onConfirm={async () => {
          try {
            await remove(isPublished);
          } finally {
            onClose(true);
          }
        }}
        onCancel={() => {
          onClose(false);
        }}
      />
    ));
  }

  const showMetadataDialog = createCommand(
    async () => {
      const result = await openEditContentTypeDialog(state.contentType);
      if (result) {
        dispatch({ type: reducerActions.UPDATE_CT_METADATA, payload: result });
      }
    },
    {
      disabled: function () {
        return (
          accessChecker.shouldDisable('update', 'contentType') ||
          accessChecker.shouldDisable('publish', 'contentType')
        );
      },
    }
  );

  const cancel = createCommand(async () => navigate({ path: 'content_types.list' }), {
    available: () => {
      return state.contextState.isNew;
    },
  });

  const saveContentType = async () => {
    try {
      setContextDirty(false);
      assureDisplayField(state.contentType);

      const buildMessage = errorMessageBuilder.forContentType;
      const schema = validation.schemas.ContentType;

      if (!schema.validate(state.contentType)) {
        const fieldNames = _.map(state.contentType.fields, 'name');
        const errors = schema.errors(state.contentType);
        const errorsWithMessages = errors.map((error) => buildMessage(error));
        notify.invalidAccordingToScope(errorsWithMessages, fieldNames);
        return Promise.reject();
      }

      if ((state.contentType.fields || []).length < 1) {
        notify.saveNoFields();
        return Promise.reject();
      }

      const cmaClient = getSpaceEnvCMAClient();

      // Enable Assembly Types feature if Compose is installed
      const isAssemblyEnabled = await checkComposeIsInstalled(spaceContext.getId() as string);
      const assemblyHeaders = isAssemblyEnabled ? getAlphaHeader(ASSEMBLY_TYPES) : {};

      const updatedContentType = await cmaClient.contentType.update(
        {
          contentTypeId: state.contentType.sys.id,
        },
        state.contentType,
        {
          ...assemblyHeaders,
          // `X-Contentful-Skip-Transformation` needed here as the old code was relying on it.
          // This header makes the operation work with the internal ids for content type fields
          // instead of using their human-readable format
          'x-contentful-skip-transformation': true,
        }
      );
      const published = await spaceContext.publishedCTs.publish(updatedContentType);
      setContentType(published);
      // When a Content Type is published the CMA automatically
      // updates the Editor Interface. We need to fetch and update
      // the sys of a local entity so we can override it.
      const remoteEditorInterface = await spaceContext.cma.getEditorInterface(published.sys.id);
      const localEditorInterface = _.cloneDeep(state.editorInterface);
      localEditorInterface.sys = remoteEditorInterface.sys;
      const updatedEditorInterface = await spaceContext.cma.updateEditorInterface(
        EditorInterfaceTransformer.toAPI(published, localEditorInterface)
      );
      const editorInterfaceFromAPI = EditorInterfaceTransformer.fromAPI(
        published,
        updatedEditorInterface
      );
      dispatch({
        type: reducerActions.UPDATE_EDITOR_INTERFACE,
        payload: { editorInterface: editorInterfaceFromAPI },
      });
      getContentPreview().clearCache();
      spaceContext.uiConfig!.addOrEditCt(state.contentType).catch(_.noop);

      fieldsUpdated(published, updatedEditorInterface as any);

      notify.saveSuccess();
    } catch (error) {
      setContextDirty(true);
      trackEnforcedButtonClick(error);
      triggerApiErrorNotification(error);
    } finally {
      if (state.contextState.isNew) {
        goToDetails(state.contentType);
      }
    }
  };

  useEffect(() => {
    registerSaveAction(saveContentType);

    // TODO: remove with angular state migration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveContentType]);

  const save = createCommand(saveContentType, {
    disabled: function () {
      const hasUnpublishedChanges =
        isDraft(state.contentType) ||
        state.contentType.sys.version > (state.contentType.sys.publishedVersion || 0) + 1;

      const dirty = state.contextState.dirty || hasUnpublishedChanges;

      const valid = !allFieldsInactive(state.contentType);
      const denied =
        accessChecker.shouldDisable('update', 'contentType') ||
        accessChecker.shouldDisable('publish', 'contentType');

      return !dirty || !valid || denied;
    },
  });

  // This is called by the state manager in case the user leaves the
  // Content Type editor without saving. We do not redirect in that
  // case.

  const saveAndClose = () => saveContentType();

  function triggerApiErrorNotification(errOrErrContainer) {
    const reasons = _.get(errOrErrContainer, 'data.details.errors', []);
    const sizeReason = reasons.find(({ name }) => name === 'size');
    if (sizeReason) {
      notify.tooManyEditorsError(sizeReason);
    } else {
      notify.saveFailure(errOrErrContainer, state.contentType);
    }
  }

  const getPublishedField = (id) => {
    const publishedFields = _.get(
      spaceContext.publishedCTs.get(state.contentType.sys.id),
      'fields',
      []
    );
    return _.cloneDeep(_.find(publishedFields, { id }));
  };

  const deleteField = async (field, isTitle) => {
    const publishedField = getPublishedField(field.id);
    const publishedOmitted = publishedField?.omitted;

    const isOmittedInApiAndUi = publishedOmitted && field.omitted;
    const isOmittedInUiOnly = !publishedOmitted && field.omitted;

    if (isTitle) {
      openDisallowDialog({ field, action: 'delete' });
    } else if (!publishedField) {
      removeField(field.id);
    } else if (isOmittedInApiAndUi) {
      updateField(field.id, {
        deleted: true,
      });
    } else if (isOmittedInUiOnly) {
      await openSaveDialog();
      save.execute();
    } else {
      await openOmitDialog();
      toggleFieldProperty(field, 'omitted', isTitle);
    }
  };

  const askAboutRedirection = async (duplicated) => {
    const confirmed = await ModalLauncher.open(({ isShown, onClose }) => (
      <ModalConfirm
        shouldCloseOnEscapePress={false}
        shouldCloseOnOverlayClick={false}
        isShown={isShown}
        onConfirm={() => onClose(true)}
        onCancel={onClose}
        title="Duplicated content type"
        confirmLabel="Go to the duplicated content type."
        confirmTestId="go-to-duplicated-content-type"
        cancelLabel={false}>
        <Paragraph>Content type was successfully duplicated.</Paragraph>
      </ModalConfirm>
    ));
    if (confirmed) {
      // mark the form as pristine so we can navigate without confirmation dialog
      setContextDirty(false);
      return router.navigate({
        path: 'content_types.detail',
        contentTypeId: duplicated.sys.id,
        tab: TABS.fields,
      });
    }
  };

  const createDuplicate = async ({ contentTypeId, name, description }) => {
    try {
      const data = { ...state.contentType, name, description };

      const cmaClient = getSpaceEnvCMAClient();
      const duplicatedContentType = await cmaClient.contentType.update(
        {
          contentTypeId,
        },
        data,
        {
          'x-contentful-skip-transformation': true,
        }
      );

      const editorInterfaceDuplicate = {
        ..._.cloneDeep(state.editorInterface),
        sys: {
          id: 'default',
          type: 'EditorInterface',
          version: 1,
          contentType: { sys: { id: contentTypeId } },
        },
      };

      const published = await spaceContext.publishedCTs.publish(duplicatedContentType);

      spaceContext.cma.updateEditorInterface(
        EditorInterfaceTransformer.toAPI(published, editorInterfaceDuplicate)
      );

      return duplicatedContentType;
    } catch (err) {
      notify.duplicateError();
    }
  };

  const duplicate = createCommand(
    async () => {
      const duplicatedContentType = await openDuplicateContentTypeDialog(
        state.contentType,
        createDuplicate,
        contentTypeIds
      );

      if (!duplicatedContentType) {
        return;
      }
      await askAboutRedirection(duplicatedContentType);

      notify.duplicateSuccess();
    },
    {
      disabled: function () {
        const isNew = state.contextState.isNew;
        const isDenied =
          accessChecker.shouldDisable('update', 'contentType') ||
          accessChecker.shouldDisable('publish', 'contentType');
        const isPublishedCT = isPublished(state.contentType);
        const isDirty = state.contextState.dirty || !isPublishedCT;

        return isNew || isDenied || isDirty;
      },
    }
  );

  const actions = {
    setContentType,
    openFieldDialog,
    updateField,
    undeleteField,
    updateOrder,
    setFieldAsTitle,
    toggleFieldProperty,
    deleteField,
    showNewFieldDialog,
    delete: deleteContentType,
    showMetadataDialog,
    cancel,
    save,
    saveAndClose,
    duplicate,
  };

  return {
    actions,
    state,
    setContextDirty,
    setEditorInterface,
    contentTypeIds,
    hasAdvancedExtensibility,
    extensions,
  };
}
