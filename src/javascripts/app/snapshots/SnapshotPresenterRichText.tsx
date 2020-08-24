import React, { useMemo } from 'react';
import { FieldExtensionSDK } from 'contentful-ui-extensions-sdk';

import { getModule } from 'core/NgRegistry';
import { createReadonlyFieldWidgetSDK } from 'app/widgets/createFieldWidgetSDK';
import { ReadOnlyRichTextEditor } from 'app/widgets/RichText';
import { Entity } from 'app/entity_editor/Document/types';
import { Field, Locale } from 'app/entity_editor/EntityField/types';
import { InternalContentType } from 'app/widgets/createFieldWidgetSDK/createContentTypeApi';
import { createTagsRepo } from 'features/content-tags';
import { EditorInterface, WidgetNamespace } from 'features/widget-renderer';

const SnapshotPresenterRichText = ({
  className,
  value,
  entity,
  editorData,
  field,
  locale,
  widget,
}: SnapshotPresenterRichTextProps) => {
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
  }, [field, locale, entity, editorData, value, widget]);

  return (
    <div className={className} data-test-id="snapshot-presenter-richtext">
      {sdk && <ReadOnlyRichTextEditor value={value} sdk={sdk} />}
    </div>
  );
};

interface SnapshotPresenterRichTextProps {
  className: string;
  value: any;
  editorData: {
    contentType: { data: InternalContentType };
    editorInterface: EditorInterface;
  };
  entity: Entity;
  field: Field;
  locale: Locale;
  widget: {
    id: string;
    namespace: WidgetNamespace;
  };
}

SnapshotPresenterRichText.defaultProps = {
  className: '',
};

export default SnapshotPresenterRichText;