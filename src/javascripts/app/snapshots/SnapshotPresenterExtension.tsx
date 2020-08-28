import React, { useMemo } from 'react';

import { FieldExtensionSDK } from 'contentful-ui-extensions-sdk';
import { getModule } from 'core/NgRegistry';
import { createReadonlyFieldWidgetSDK } from 'app/widgets/createFieldWidgetSDK';
import {
  EditorInterface,
  Widget,
  WidgetLocation,
  WidgetRenderer,
} from '@contentful/widget-renderer';
import { InternalContentType } from 'app/widgets/createFieldWidgetSDK/createContentTypeApi';
import { createTagsRepo } from 'features/content-tags';
import { Locale } from 'app/entity_editor/EntityField/types';
import { Entity } from 'app/entity_editor/Document/types';

interface SnapshotPresenterExtensionProps {
  locale: Locale;
  field: {
    apiName?: string;
    id: string;
  };
  entity: Entity;
  editorData: {
    contentType: { data: InternalContentType };
    editorInterface: EditorInterface;
  };
  value: any;
  widget: Widget;
}

const SnapshotPresenterExtension = ({
  widget,
  value,
  editorData,
  entity,
  locale,
  field,
}: SnapshotPresenterExtensionProps) => {
  const sdk: FieldExtensionSDK = useMemo(() => {
    const spaceContext = getModule('spaceContext');

    return createReadonlyFieldWidgetSDK({
      cma: spaceContext.cma,
      editorInterface: editorData.editorInterface,
      endpoint: spaceContext.endpoint,
      entry: entity,
      environmentIds: [spaceContext.getEnvironmentId(), ...spaceContext.getAliasesIds()],
      publicFieldId: field.apiName ?? field.id,
      fieldValue: value,
      initialContentTypes: spaceContext.publishedCTs.getAllBare(),
      internalContentType: editorData.contentType.data,
      publicLocaleCode: locale.code,
      spaceId: spaceContext.getId(),
      spaceMember: spaceContext.space.data.spaceMember,
      tagsRepo: createTagsRepo(spaceContext.endpoint, spaceContext.getEnvironmentId()),
      usersRepo: spaceContext.users,
      widgetId: widget.id,
      widgetNamespace: widget.namespace,
    });
  }, [field, locale, entity, editorData, widget, value]);

  return (
    <div data-test-id="snapshot-presenter-extension">
      <WidgetRenderer location={WidgetLocation.ENTRY_FIELD} sdk={sdk} widget={widget} />
    </div>
  );
};

SnapshotPresenterExtension.defaultProps = {
  className: '',
};

export default SnapshotPresenterExtension;
