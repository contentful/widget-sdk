import React, { useState } from 'react';
import _ from 'lodash';
import validation from '@contentful/validation';
import { ModalConfirm, Paragraph } from '@contentful/forma-36-react-components';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';
import ReloadNotification from 'app/common/ReloadNotification';
import * as notify from './Notifications';
import * as Analytics from 'analytics/Analytics';
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
import { getModule } from 'core/NgRegistry';
import { openFieldDialog } from 'components/field_dialog/openFieldDialog';
import { openDisallowDialog, openOmitDialog, openSaveDialog } from './FieldsTab/FieldTabDialogs';
import { syncControls } from 'widgets/EditorInterfaceTransformer';
import { AddFieldDialogModal } from './Dialogs/AddField';
import { openEditContentTypeDialog } from './Dialogs';
import getContentTypePreview from './PreviewTab/getContentTypePreview';

import errorMessageBuilder from 'services/errorMessageBuilder/errorMessageBuilder';

export default function useCreateActions(props) {
  // TODO: pull out spaceContext
  const spaceContext = getModule('spaceContext');

  const [contextState, setContextState] = useState({ isNew: props.isNew, dirty: false });
  const [contentTypeModel, setContentTypeModel] = useState(props.contentType);
  const [publishedContentType, setPublishedContentType] = useState(props.publishedContentType);
  const [editorInterface, setEditorInterface] = useState(props.editorInterface);

  const setContextDirty = (dirty) => {
    // this is needed to keep $scope.context.dirty up-to-date
    // TODO: remove after src/javascripts/navigation/stateChangeHandlers.js migration
    props.updateContextDirty(dirty);
    setContextState((state) => ({ ...state, dirty }));
  };

  const updateFields = (fields) =>
    setContentTypeModel({ ...contentTypeModel, data: { ...contentTypeModel.data, fields } });

  const actions = {};

  actions.openFieldDialog = (field) => {
    const fieldId = field.apiName || field.id;
    const widget = (editorInterface.controls || []).find((control) => {
      return control.fieldId === fieldId;
    });
    const updateWidgetSettings = (widget) => {
      setEditorInterface((editorInterface) => {
        const controls = editorInterface.controls.map((control) => {
          if (control.fieldId === widget.fieldId) {
            return widget;
          } else return control;
        });
        return { ...editorInterface, controls };
      });
    };

    return openFieldDialog({
      contentTypeModel,
      setContentTypeModel,
      field,
      widget,
      updateWidgetSettings,
      setContextDirty,
      editorInterface,
      extensions: props.extensions,
    });
  };

  actions.updateField = (id, update) => {
    const updatedFields = contentTypeModel.data.fields.map((field) => {
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

  actions.undeleteField = (field) => {
    actions.updateField(field.id, {
      deleted: false,
    });
    setContextDirty(true);
  };

  actions.updateOrder = (fields) => {
    updateFields(fields);
    setContextDirty(true);
  };

  actions.setFieldAsTitle = (field) => {
    setContentTypeModel((ct) => {
      ct.data.displayField = field.id;
      return ct;
    });
    setContextDirty(true);
  };

  actions.toggleFieldProperty = (field, property, isTitle) => {
    const toggled = !field[property];

    if (isTitle && toggled) {
      openDisallowDialog({ field, action: 'disable' });
    } else {
      actions.updateField(field.id, {
        [property]: toggled,
      });
      setContextDirty(true);
    }
  };
  function syncEditorInterface() {
    setEditorInterface({
      ...editorInterface,
      controls: syncControls(contentTypeModel.data, editorInterface.controls),
    });
  }

  const removeField = (id) => {
    const fields = contentTypeModel.data.fields;
    _.remove(fields, { id: id });
    updateFields(fields);
    syncEditorInterface();
  };

  const getPublishedField = (id) => {
    const publishedFields = _.get(publishedContentType, 'data.fields', []);
    return _.cloneDeep(_.find(publishedFields, { id: id }));
  };

  actions.deleteField = async (field, isTitle) => {
    const publishedField = getPublishedField(field.id);
    const publishedOmitted = publishedField && publishedField.omitted;

    const isOmittedInApiAndUi = publishedOmitted && field.omitted;
    const isOmittedInUiOnly = !publishedOmitted && field.omitted;

    if (isTitle) {
      openDisallowDialog({ field, action: 'delete' });
    } else if (!publishedField) {
      removeField(field.id);
    } else if (isOmittedInApiAndUi) {
      actions.updateField(field.id, {
        deleted: true,
      });
      setContextDirty(true);
    } else if (isOmittedInUiOnly) {
      await openSaveDialog();
      actions.save.execute();
    } else {
      await openOmitDialog();
      actions.toggleFieldProperty(field, 'omitted', isTitle);
    }
  };

  function addField(newField) {
    updateFields([...contentTypeModel.data.fields, newField]);
    setContextDirty(true);
    syncEditorInterface();
    trackAddedField(contentTypeModel, newField);
  }

  function trackAddedField(contentType, field) {
    Analytics.track('content_modelling:field_added', {
      contentTypeId: contentType.getId(),
      contentTypeName: contentType.getName(),
      fieldId: field.id,
      fieldName: field.name,
      fieldType: field.type,
      fieldItemType: _.get(field, 'items.type') || null,
      fieldLocalized: field.localized,
      fieldRequired: field.required,
    });
  }

  actions.showNewFieldDialog = createCommand(
    () => {
      const existingApiNames = contentTypeModel.data.fields.map(({ apiName }) => apiName);
      ModalLauncher.open(({ isShown, onClose }) => (
        <AddFieldDialogModal
          isShown={isShown}
          onClose={onClose}
          onConfirm={addField}
          onConfirmAndConfigure={(field) => {
            addField(field);
            actions.openFieldDialog(field);
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

  /**
   * @ngdoc property
   * @name ContentTypeActionsController#delete
   * @type {Command}
   */
  actions.delete = createCommand(startDeleteFlow, {
    available: function () {
      const deletableState =
        !contextState.isNew && (contentTypeModel.canUnpublish() || !contentTypeModel.isPublished());
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

  function startDeleteFlow() {
    return checkRemovable().then((status) => {
      if (status.isRemovable) {
        return confirmRemoval(status.isPublished);
      } else {
        forbidRemoval(status.entryCount);
      }
    }, ReloadNotification.basicErrorHandler);
  }

  function checkRemovable() {
    const isPublished = contentTypeModel.isPublished();
    const canRead = accessChecker.canPerformActionOnEntryOfType('read', contentTypeModel.getId());

    if (!isPublished) {
      return Promise.resolve(createStatusObject(true));
    }

    return spaceContext.space
      .getEntries({
        content_type: contentTypeModel.getId(),
        limit: 0,
      })
      .then(
        (res) => {
          const count = res.total;
          return createStatusObject(canRead && count < 1, count);
        },
        (res) => {
          if (res.statusCode === 404 && !canRead) {
            return createStatusObject(false);
          } else {
            return Promise.reject(res);
          }
        }
      );

    function createStatusObject(isRemovable, entryCount) {
      return {
        isPublished,
        isRemovable,
        entryCount,
      };
    }
  }

  function remove(isPublished) {
    const unpub = isPublished ? unpublish() : Promise.resolve();
    return unpub.then(sendDeleteRequest);
  }

  function forbidRemoval(count) {
    return ModalLauncher.open(({ isShown, onClose }) => (
      <ContentTypeForbiddenRemoval
        isShown={isShown}
        onClose={onClose}
        entriesCount={count}
        contentTypeName={contentTypeModel.data.name}
      />
    ));
  }

  function confirmRemoval(isPublished) {
    const key = Date.now();
    return ModalLauncher.open(({ isShown, onClose }) => (
      <DeleteContentTypeDialog
        key={key}
        contentTypeName={contentTypeModel.data.name}
        isShown={isShown}
        onConfirm={() => {
          return remove(isPublished).finally(() => {
            onClose(true);
          });
        }}
        onCancel={() => {
          onClose(false);
        }}
      />
    ));
  }

  function trackEnforcedButtonClick(err) {
    // If we get reason(s), that means an enforcement is present
    const reason = _.get(err, 'body.details.reasons', null);

    Analytics.track('entity_button:click', {
      entityType: 'contentType',
      enforced: Boolean(reason),
      reason,
    });

    return Promise.reject(err);
  }

  function unpublish() {
    return spaceContext.publishedCTs.unpublish(contentTypeModel).then(
      () => {
        setPublishedContentType(null);
      },
      (err) => {
        logger.logServerWarn('Error deactivating Content Type', { error: err });
        return Promise.reject(err);
      }
    );
  }

  function sendDeleteRequest() {
    return contentTypeModel.delete().then(() => {
      notify.deleteSuccess();
      go({ path: '^.^.list' });
    }, notify.deleteFail);
  }

  actions.showMetadataDialog = createCommand(
    () => {
      openEditContentTypeDialog(contentTypeModel).then((result) => {
        if (result) {
          const { name, description } = result;
          setContentTypeModel((ct) => {
            ct.data.name = name;
            ct.data.description = description;
            return ct;
          });
          setContextDirty(true);
        }
      });
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

  /**
   * @ngdoc property
   * @name ContentTypeActionsController#scope#cancel
   * @type {Command}
   */
  actions.cancel = createCommand(
    () =>
      // X.detail.fields -> X.list
      go({ path: '^.^.list' }),
    {
      available: () => {
        return contextState.isNew;
      },
    }
  );

  const save = (redirect) => {
    assureDisplayField(contentTypeModel.data);

    const buildMessage = errorMessageBuilder.forContentType;
    const schema = validation.schemas.ContentType;

    if (!schema.validate(contentTypeModel.data)) {
      const fieldNames = _.map(contentTypeModel.data.fields, 'name');
      const errors = schema.errors(contentTypeModel.data);
      const errorsWithMessages = errors.map((error) => buildMessage(error));
      notify.invalidAccordingToScope(errorsWithMessages, fieldNames);
      return Promise.reject();
    }

    if ((contentTypeModel.data.fields || []).length < 1) {
      notify.saveNoFields();
      return Promise.reject();
    }

    return (
      props
        .saveContentType(contentTypeModel.data)
        .then((contentType) => {
          setContentTypeModel(contentType);
          return spaceContext.publishedCTs.publish(contentType);
        })
        .then((published) => {
          setPublishedContentType(published);

          // When a Content Type is published the CMA automatically
          // updates the Editor Interface. We need to fetch and update
          // the sys of a local entity so we can override it.
          return spaceContext.cma.getEditorInterface(published.data.sys.id);
        })
        .then((remoteEditorInterface) => {
          const localEditorInterface = _.cloneDeep(editorInterface);
          localEditorInterface.sys = remoteEditorInterface.sys;
          return spaceContext.cma.updateEditorInterface(
            EditorInterfaceTransformer.toAPI(publishedContentType.data, localEditorInterface)
          );
        })
        .then((editorInterface) => {
          setEditorInterface(
            EditorInterfaceTransformer.fromAPI(publishedContentType.data, editorInterface)
          );
        })
        .catch(trackEnforcedButtonClick)
        .catch(triggerApiErrorNotification)
        .then(setPristine)
        .then(() => {
          setPristine();
          getContentPreview().clearCache();
        })
        .then(() => {
          // Try to update UIConfig but proceed if it failed.
          return spaceContext.uiConfig.addOrEditCt(contentTypeModel.data).catch(() => {});
        })
        .then(() => {
          if (redirect && contextState.isNew) {
            return goToDetails(contentTypeModel);
          }
        })
        // Need to do this _after_ redirecting so it is not automatically
        // dismissed.
        .then(notify.saveSuccess)
    );
  };

  /**
   * @ngdoc property
   * @name ContentTypeActionsController#save
   * @type {Command}
   */
  actions.save = createCommand(() => save(true), {
    disabled: function () {
      const dirty =
        contextState.dirty ||
        props.contentType.hasUnpublishedChanges() ||
        !props.contentType.getPublishedVersion();
      const valid = !allFieldsInactive(contentTypeModel);
      const denied =
        accessChecker.shouldDisable('update', 'contentType') ||
        accessChecker.shouldDisable('publish', 'contentType');

      return !dirty || !valid || denied;
    },
  });

  // This is called by the state manager in case the user leaves the
  // Content Type editor without saving. We do not redirect in that
  // case.

  actions.saveAndClose = () => save(false);

  function setPristine() {
    setContextState({ ...contextState, dirty: false });
  }

  function goToDetails(contentType) {
    // X.detail.fields -> X.detail.fields with altered contentTypeId param
    return go({ path: '^.^.detail.fields', params: { contentTypeId: contentType.getId() } });
  }

  function triggerApiErrorNotification(errOrErrContainer) {
    const reasons = _.get(errOrErrContainer, 'data.details.errors', []);
    const sizeReason = reasons.find(({ name }) => name === 'size');

    if (sizeReason) {
      notify.tooManyEditorsError(errOrErrContainer, contentTypeModel, sizeReason);
    } else {
      notify.saveFailure(errOrErrContainer, contentTypeModel);
    }

    return Promise.reject(errOrErrContainer);
  }

  function allFieldsInactive(contentType) {
    const fields = contentType.data.fields || [];
    return fields.every((field) => field.disabled || field.omitted);
  }

  actions.loadPreview = (isNew) => {
    if (isNew) {
      return getContentTypePreview.fromData(contentTypeModel.data);
    } else {
      return getContentTypePreview(contentTypeModel);
    }
  };

  /**
   * @ngdoc property
   * @name ContentTypeActionsController#duplicate
   * @type {Command}
   */
  actions.duplicate = createCommand(
    async () => {
      const duplicatedContentType = await openDuplicateContentTypeDialog(
        contentTypeModel,
        createDuplicate,
        props.contentTypeIds
      );

      if (!duplicatedContentType) {
        return;
      }

      await askAboutRedirection(duplicatedContentType);

      notify.duplicateSuccess();
    },
    {
      disabled: function () {
        const isNew = contextState.isNew;
        const isDenied =
          accessChecker.shouldDisable('update', 'contentType') ||
          accessChecker.shouldDisable('publish', 'contentType');
        const isDirty = contextState.dirty || !props.contentType.getPublishedVersion();
        const isPublished = props.contentType.isPublished();

        return isNew || isDenied || isDirty || !isPublished;
      },
    }
  );

  function createDuplicate({ contentTypeId, name, description }) {
    const data = contentTypeModel.data;
    const duplicate = spaceContext.space.newContentType({
      sys: { type: 'ContentType', id: contentTypeId },
      name: name,
      description: description || '',
      fields: _.cloneDeep(data.fields),
      displayField: data.displayField,
    });

    const editorInterfaceDuplicate = {
      ..._.cloneDeep(editorInterface),
      sys: {
        id: 'default',
        type: 'EditorInterface',
        version: 1,
        contentType: { sys: { id: contentTypeId } },
      },
    };

    return duplicate
      .save()
      .then((contentType) => spaceContext.publishedCTs.publish(contentType))
      .then((published) => {
        return spaceContext.cma.updateEditorInterface(
          EditorInterfaceTransformer.toAPI(published.data, editorInterfaceDuplicate)
        );
      })
      .then(
        () => duplicate,
        (err) => {
          notify.duplicateError();
          return Promise.reject(err);
        }
      );
  }

  function askAboutRedirection(duplicated) {
    return ModalLauncher.open(({ isShown, onClose }) => (
      <ModalConfirm
        shouldCloseOnEscapePress={false}
        shouldCloseOnOverlayClick={false}
        isShown={isShown}
        onConfirm={onClose}
        onCancel={onClose}
        title="Duplicated content type"
        confirmLabel="Go to the duplicated content type."
        confirmTestId="go-to-duplicated-content-type"
        cancelLabel={null}>
        <Paragraph>Content type was successfully duplicated.</Paragraph>
      </ModalConfirm>
    )).then(() => {
      // mark the form as pristine so we can navigate without confirmation dialog
      setPristine();
      return goToDetails(duplicated);
    });
  }
  return {
    actions,
    contentTypeModel: contentTypeModel.data,
    editorInterface,
    setEditorInterface,
    contextState,
    setContextDirty,
  };
}
