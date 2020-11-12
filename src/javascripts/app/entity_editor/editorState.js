import * as K from 'core/utils/kefir';
import { truncate } from 'utils/StringUtils';
import * as Focus from 'app/entity_editor/Focus';
import * as logger from 'services/logger';
import localeStore from 'services/localeStore';
import { valuePropertyAt } from 'app/entity_editor/Document';
import { initDocErrorHandlerWithoutScope } from 'app/entity_editor/DocumentErrorHandler';
import * as Validator from 'app/entity_editor/Validator';
import * as EntityFieldValueSpaceContext from 'classes/EntityFieldValueSpaceContext';
import { initStateController } from './stateController';
import { noop } from 'lodash';

export const getEditorState = ({
  bulkEditorContext,
  editorData,
  environmentId,
  hasInitialFocus = false,
  lifeline,
  onStateUpdate,
  onTitleUpdate,
  publishedCTs,
  spaceId,
  trackView = noop,
}) => {
  if (editorData) {
    // Lifeline is required to destroy a document on e.g. slide-in editor close
    const doc = editorData.openDoc(lifeline);

    const { entityInfo, entity } = editorData;

    const validator = Validator.createForEntity({
      doc,
      entityInfo,
      locales: localeStore.getPrivateLocales(),
      publishedCTs,
    });

    initDocErrorHandlerWithoutScope(doc.state.error$);

    initStateController({
      bulkEditorContext,
      doc,
      editorData,
      entity,
      entityInfo,
      environmentId,
      onUpdate: onStateUpdate,
      publishedCTs,
      spaceId,
      validator,
    });

    K.onValue(valuePropertyAt(doc, []), (data) => {
      const title =
        EntityFieldValueSpaceContext.entityTitle({
          getType: () => entityInfo.type,
          getContentTypeId: () => entityInfo.contentTypeId,
          data,
        }) || 'Untitled';
      onTitleUpdate(truncate(title, 50));
    });

    try {
      trackView({
        editorData,
        entityInfo,
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
