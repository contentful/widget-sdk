import * as K from 'core/utils/kefir';
import { truncate } from 'utils/StringUtils';
import * as Focus from 'app/entity_editor/Focus';
import { captureError } from 'core/monitoring';
import localeStore from 'services/localeStore';
import { valuePropertyAt } from '@contentful/editorial-primitives';
import { initDocErrorHandler } from 'app/entity_editor/DocumentErrorHandler';
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
  contentTypes,
  spaceId,
  trackView = noop,
}: {
  bulkEditorContext?: any;
  editorData: any;
  environmentId: string;
  hasInitialFocus?: boolean;
  lifeline: any;
  onStateUpdate: any;
  onTitleUpdate: any;
  contentTypes: any;
  spaceId?: string;
  trackView?: (data: any) => void;
}) => {
  if (editorData) {
    // Lifeline is required to destroy a document on e.g. slide-in editor close
    const doc = editorData.openDoc(lifeline);

    const { entityInfo } = editorData;

    const validator = Validator.createForEntity({
      doc,
      entityInfo,
      locales: localeStore.getPrivateLocales(),
    });

    initDocErrorHandler(doc.state.error$);

    initStateController({
      bulkEditorContext,
      doc,
      editorData,
      entityInfo,
      environmentId,
      onUpdate: onStateUpdate,
      contentTypes,
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
      captureError(error);
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
