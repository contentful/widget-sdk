import React, { useEffect, useReducer } from 'react';
import { getModule } from 'core/NgRegistry';
import _ from 'lodash';
import validation from '@contentful/validation';
import { ModalConfirm, Paragraph } from '@contentful/forma-36-react-components';
import { ModalLauncher } from '@contentful/forma-36-react-components';
import ReloadNotification from 'app/common/ReloadNotification';
import * as notify from './Notifications';
import { trackAddedField, trackEnforcedButtonClick } from './Analytics';
import { allFieldsInactive, goToDetails, getWidget } from './Utils';
import * as accessChecker from 'access_control/AccessChecker';
import assureDisplayField from 'data/ContentTypeRepo/assureDisplayField';
import * as logger from 'services/logger';
import * as EditorInterfaceTransformer from 'widgets/EditorInterfaceTransformer';
import ContentTypeForbiddenRemoval from './Dialogs/ContenTypeForbiddenRemoval';
import DeleteContentTypeDialog from './Dialogs/DeleteContentTypeDialog';
import { openDuplicateContentTypeDialog } from './Dialogs';
import { getContentPreview } from 'features/content-preview';
import { createCommand } from 'utils/command/command';
import { go } from 'states/Navigator';
import { getUpdatedField } from 'components/field_dialog/openFieldDialog';
import { openFieldModalDialog } from 'features/content-model-editor';
import { openDisallowDialog, openOmitDialog, openSaveDialog } from './FieldsTab/FieldTabDialogs';
import { AddFieldDialogModal } from './Dialogs/AddField';
import { openEditContentTypeDialog } from './Dialogs';
import getContentTypePreview from './PreviewTab/getContentTypePreview';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { reducer, reducerActions, initActionsReducer } from './ActionsReducer';

import errorMessageBuilder from 'services/errorMessageBuilder/errorMessageBuilder';

export default function useCreateActions(props) {
  const [state, dispatch] = useReducer(
    reducer,
    {
      isNew: props.isNew,
      editorInterface: props.editorInterface,
      contentTypeData: props.contentTypeData,
    },
    initActionsReducer
  );
  // TODO: remove 'spaceContext'
  const spaceContext = getModule('spaceContext');

  const { currentSpace, currentSpaceContentTypes, currentSpaceId: spaceId } = useSpaceEnvContext();

  const contentTypeIds = currentSpaceContentTypes.map((ct) => ct.sys.id);

  const setContentType = (contentType) => {
    dispatch({ type: reducerActions.SET_CONTENT_TYPE, payload: { contentType } });
  };

  useEffect(() => {
    // updates content type on scope so correct data can be saved from angular context
    props.syncContentTypeWithScope(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.contentType, state.editorInterface]);

  useEffect(() => {
    // this is needed to keep $scope.context.dirty up-to-date
    // TODO: remove after src/javascripts/navigation/stateChangeHandlers.js migration
    props.updateAngularContext(state.contextState.dirty);
  }, [state.contextState.dirty, props]);

  useEffect(() => {
    async function initContentType() {
      const contentType = props.contentTypeId
        ? await currentSpace.getContentType(props.contentTypeId)
        : await currentSpace.newContentType({
            sys: { type: 'ContentType' },
            fields: [],
          });
      setContentType(contentType);
    }
    initContentType();
    // We only need to get this information once - of content type ID is changed,
    // it means the whole page is re-rendered anyway
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setEditorInterface = (editorInterface) => {
    dispatch({ type: reducerActions.UPDATE_EDITOR_INTERFACE, payload: { editorInterface } });
  };

  const setContextDirty = (dirty) => {
    dispatch({ type: reducerActions.SET_CONTEXT_STATE_DIRTY, payload: { dirty } });
  };

  const setPristine = () => {
    dispatch({ type: reducerActions.SET_CONTEXT_STATE_DIRTY, payload: { dirty: false } });
  };

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
      const controls = state.editorInterface.controls.some(
        (control) => control.fieldId === field.apiName
      )
        ? state.editorInterface.controls.map((control) => {
            if (control.fieldId === field.apiName) {
              return updatedControl;
            }
            return control;
          })
        : [...state.editorInterface.controls, updatedControl];

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

      const updatedCTfields = state.contentType.data.fields.find(
        (field) => field.id === updatedField.id
      )
        ? state.contentType.data.fields.map((field) =>
            field.id === updatedField.id ? updatedField : field
          )
        : state.contentType.data.fields.concat([updatedField]);

      updateFields(updatedCTfields);

      updateWidgetSettings(widgetSettings, updatedField);
    };

    return openFieldModalDialog(
      field,
      widget,
      state.contentType,
      onFieldUpdate,
      state.editorInterface,
      props.extensions
    );
  };

  const updateField = (id, update) => {
    const updatedFields = state.contentType.data.fields.map((field) => {
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
    () => {
      const existingApiNames = state.contentType.data.fields.map(({ apiName }) => apiName);
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
        return (
          accessChecker.shouldDisable('update', 'contentType') ||
          accessChecker.shouldDisable('publish', 'contentType')
        );
      },
    }
  );

  const checkRemovable = async () => {
    const isPublished = state.contentType.isPublished();
    const canRead = accessChecker.canPerformActionOnEntryOfType('read', state.contentType.getId());
    try {
      if (!isPublished) {
        return Promise.resolve(createStatusObject(true));
      }
      const res = await currentSpace.getEntries({
        content_type: state.contentType.getId(),
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

    function createStatusObject(isRemovable, entryCount) {
      return {
        isPublished,
        isRemovable,
        entryCount,
      };
    }
  };

  const startDeleteFlow = async () => {
    try {
      const status = await checkRemovable(state.contentType, currentSpace);
      if (status.isRemovable) {
        return confirmRemoval(status.isPublished);
      } else {
        forbidRemoval(status.entryCount);
      }
    } catch (error) {
      ReloadNotification.basicErrorHandler(error);
    }
  };

  const deleteContentType = createCommand(startDeleteFlow, {
    available: function () {
      const deletableState =
        !state.contextState.isNew &&
        (state.contentType.canUnpublish() || !state.contentType.isPublished());
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
      logger.logServerWarn('Error deactivating Content Type', { error });
    }
  };

  const sendDeleteRequest = async () => {
    try {
      await state.contentType.delete();
      notify.deleteSuccess();
      go({ path: '^.^.list' });
    } catch (error) {
      notify.deleteFail(error);
    }
  };

  const remove = async (isPublished) => {
    const unpub = isPublished ? unpublish() : Promise.resolve();
    const res = await unpub;
    return sendDeleteRequest(res);
  };

  function forbidRemoval(count) {
    return ModalLauncher.open(({ isShown, onClose }) => (
      <ContentTypeForbiddenRemoval
        isShown={isShown}
        onClose={onClose}
        entriesCount={count}
        contentTypeName={state.contentType.data.name}
      />
    ));
  }

  function confirmRemoval(isPublished) {
    const key = Date.now();
    return ModalLauncher.open(({ isShown, onClose }) => (
      <DeleteContentTypeDialog
        key={key}
        contentTypeName={state.contentType.data.name}
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

  const cancel = createCommand(
    () =>
      // X.detail.fields -> X.list
      go({ path: '^.^.list' }),
    {
      available: () => {
        return state.contextState.isNew;
      },
    }
  );

  const saveContentType = async () => {
    try {
      assureDisplayField(state.contentType.data);

      const buildMessage = errorMessageBuilder.forContentType;
      const schema = validation.schemas.ContentType;

      if (!schema.validate(state.contentType.data)) {
        const fieldNames = _.map(state.contentType.data.fields, 'name');
        const errors = schema.errors(state.contentType.data);
        const errorsWithMessages = errors.map((error) => buildMessage(error));
        notify.invalidAccordingToScope(errorsWithMessages, fieldNames);
        return Promise.reject();
      }

      if ((state.contentType.data.fields || []).length < 1) {
        notify.saveNoFields();
        return Promise.reject();
      }

      const updatedContentType = await state.contentType.save({}, spaceId);
      setContentType(updatedContentType);
      const published = await spaceContext.publishedCTs.publish(state.contentType);
      // When a Content Type is published the CMA automatically
      // updates the Editor Interface. We need to fetch and update
      // the sys of a local entity so we can override it.
      const remoteEditorInterface = await spaceContext.cma.getEditorInterface(
        published.data.sys.id
      );
      const localEditorInterface = _.cloneDeep(state.editorInterface);
      localEditorInterface.sys = remoteEditorInterface.sys;
      const updatedEditorInterface = await spaceContext.cma.updateEditorInterface(
        EditorInterfaceTransformer.toAPI(published.data, localEditorInterface)
      );
      const editorInterfaceFromAPI = EditorInterfaceTransformer.fromAPI(
        published.data,
        updatedEditorInterface
      );
      dispatch({
        type: reducerActions.UPDATE_EDITOR_INTERFACE,
        payload: { editorInterface: editorInterfaceFromAPI },
      });
      setPristine();
      getContentPreview().clearCache();
      spaceContext.uiConfig.addOrEditCt(state.contentType.data).catch(() => {});
      if (state.contextState.isNew) {
        return goToDetails(state.contentType);
      }
      setContextDirty(false);
      notify.saveSuccess();
    } catch (error) {
      trackEnforcedButtonClick(error);
      triggerApiErrorNotification(error);
    }
  };

  const save = createCommand(saveContentType, {
    disabled: function () {
      const dirty =
        state.contextState.dirty ||
        (_.isFunction(state.contentType.hasUnpublishedChanges) &&
          state.contentType.hasUnpublishedChanges()) ||
        (_.isFunction(state.contentType.getPublishedVersion) &&
          !state.contentType.getPublishedVersion());
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

  const saveAndClose = () => saveContentType(false);

  function triggerApiErrorNotification(errOrErrContainer) {
    const reasons = _.get(errOrErrContainer, 'data.details.errors', []);
    const sizeReason = reasons.find(({ name }) => name === 'size');
    if (sizeReason) {
      notify.tooManyEditorsError(sizeReason);
    } else {
      notify.saveFailure(errOrErrContainer, state.contentType);
    }
  }

  const loadPreview = (isNew) => {
    if (isNew) {
      return getContentTypePreview.fromData(state.contentType.data);
    } else {
      return getContentTypePreview(state.contentType);
    }
  };

  const getPublishedField = (id) => {
    const publishedFields = _.get(state.contentType, 'data.fields', []);
    return _.cloneDeep(_.find(publishedFields, { id: id }));
  };

  const deleteField = async (field, isTitle) => {
    const publishedField = getPublishedField(field.id);
    const publishedOmitted = publishedField && publishedField.omitted;

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
      setContextDirty(true);
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
        cancelLabel={null}>
        <Paragraph>Content type was successfully duplicated.</Paragraph>
      </ModalConfirm>
    ));
    if (confirmed) {
      // mark the form as pristine so we can navigate without confirmation dialog
      setPristine();
      return goToDetails(duplicated);
    }
  };

  const createDuplicate = async ({ contentTypeId, name, description }) => {
    try {
      const data = state.contentType.data;
      const duplicate = currentSpace.newContentType({
        sys: { type: 'ContentType', id: contentTypeId },
        name: name,
        description: description || '',
        fields: _.cloneDeep(data.fields),
        displayField: data.displayField,
      });

      const editorInterfaceDuplicate = {
        ..._.cloneDeep(state.editorInterface),
        sys: {
          id: 'default',
          type: 'EditorInterface',
          version: 1,
          contentType: { sys: { id: contentTypeId } },
        },
      };

      await duplicate.save();
      const published = await spaceContext.publishedCTs.publish(duplicate);
      spaceContext.cma.updateEditorInterface(
        EditorInterfaceTransformer.toAPI(published.data, editorInterfaceDuplicate)
      );
      return duplicate;
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
        const isDirty = state.contextState.dirty || !state.contentType.getPublishedVersion();
        const isPublished = state.contentType.isPublished();

        return isNew || isDenied || isDirty || !isPublished;
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
    loadPreview,
    duplicate,
  };

  return {
    actions,
    state,
    setContextDirty,
    setEditorInterface,
  };
}
