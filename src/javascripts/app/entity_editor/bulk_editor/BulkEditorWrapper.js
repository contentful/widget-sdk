import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { BulkEditor } from './BulkEditor';
import { deepFreeze } from 'utils/Freeze';
import cloneDeep from 'lodash/cloneDeep';
import noop from 'lodash/noop';
import * as K from 'core/utils/kefir';
import { valuePropertyAt } from '@contentful/editorial-primitives';
import { goToPreviousSlideOrExit } from 'navigation/SlideInNavigator';

export function createReferenceContext(entityInfo, doc, slide, preferences, cb = noop) {
  const [_entryId, fieldId, localeCode, focusIndex] = slide.path;
  // The links$ property should end when the editor is closed
  const field = entityInfo.contentType.fields.find(({ apiName }) => apiName === fieldId);
  const lifeline = K.createBus();
  const links$ = K.endWith(
    valuePropertyAt(doc, ['fields', field.id, localeCode]),
    lifeline.stream
  ).map((links) => links || []);

  return {
    links$,
    focusIndex,
    editorSettings: deepFreeze(cloneDeep(preferences)),
    parentId: entityInfo.id,
    field,
    add: (link) => {
      return doc.pushValueAt(['fields', field.id, localeCode], link);
    },
    remove: (index) => {
      return doc.removeValueAt(['fields', field.id, localeCode, index]);
    },
    close: (closeReason) => {
      lifeline.end();
      goToPreviousSlideOrExit(closeReason, () => {
        // Bulk editor can't ever be the one and only slide. So e.g. returning to
        // the content list on a "<" click is a use-case we do not have to handle.
        throw new Error('Unexpected "exit" after closing bulk editor');
      });
      cb();
    },
  };
}

export const BulkEditorWrapper = ({ editorData, slide }) => {
  const referenceContext = useMemo(() => {
    const lifeline = K.createBus();
    const onDestroy = () => lifeline.end();
    const doc = editorData.openDoc(lifeline.stream);

    return createReferenceContext(editorData.entityInfo, doc, slide, onDestroy);
  }, [editorData, slide]);

  return <BulkEditor referenceContext={referenceContext} />;
};

BulkEditorWrapper.propTypes = {
  editorData: PropTypes.object.isRequired,
  slide: PropTypes.object.isRequired,
};
