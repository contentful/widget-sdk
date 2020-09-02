import * as K from 'core/utils/kefir';
import { truncate } from 'utils/StringUtils';
import * as Focus from 'app/entity_editor/Focus';
import * as logger from 'services/logger';
import localeStore from 'services/localeStore';
import { trackEntryView } from 'app/entity_editor/Tracking';
import { valuePropertyAt } from 'app/entity_editor/Document';
import setupNoShareJsCmaFakeRequestsExperiment from 'app/entity_editor/NoShareJsCmaFakeRequestsExperiment';
import { initDocErrorHandlerWithoutScope } from 'app/entity_editor/DocumentErrorHandler';
import * as Validator from 'app/entity_editor/Validator';
import * as EntityFieldValueSpaceContext from 'classes/EntityFieldValueSpaceContext';
import { initStateController } from './stateController';

export const getEditorState = ({
  editorData,
  editorType,
  spaceContext,
  bulkEditorContext,
  getTitle,
  onStateUpdate,
  onTitleUpdate,
  currentSlideLevel = 0,
  hasInitialFocus = false,
}) => {
  if (editorData) {
    const doc = editorData.openDoc(K.createBus().stream);

    const { entityInfo, entity } = editorData;

    const validator = Validator.createForEntry(
      entityInfo.contentType,
      doc,
      spaceContext.publishedCTs,
      localeStore.getPrivateLocales()
    );

    initDocErrorHandlerWithoutScope(doc.state.error$);

    initStateController({
      bulkEditorContext,
      editorData,
      entity,
      entityInfo,
      getTitle,
      onUpdate: onStateUpdate,
      doc,
      spaceContext,
      validator,
    });

    setupNoShareJsCmaFakeRequestsExperiment({
      spaceContext,
      doc,
      entityInfo,
    });

    K.onValue(valuePropertyAt(doc, []), (data) => {
      const title = EntityFieldValueSpaceContext.entryTitle({
        getContentTypeId: () => entityInfo.contentTypeId,
        data,
      });
      onTitleUpdate({
        title,
        truncatedTitle: truncate(title, 50),
      });
    });

    try {
      trackEntryView({
        editorData,
        entityInfo,
        currentSlideLevel,
        editorType,
        locale: localeStore.getDefaultLocale().internal_code,
      });
    } catch (error) {
      logger.logError(error);
    }

    return {
      doc,
      editorData,
      editorContext: {
        entityInfo,
        validator,
        focus: Focus.create(),
        hasInitialFocus,
      },
    };
  }
};
