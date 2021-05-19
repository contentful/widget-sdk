import React, { useMemo } from 'react';
import { FieldExtensionSDK } from '@contentful/app-sdk';

import { createReadonlyFieldWidgetSDK } from 'app/widgets/ExtensionSDKs';
import { ReadOnlyRichTextEditor } from 'app/widgets/RichText';
import type { Entity } from '@contentful/editorial-primitives';
import { Field, Locale } from 'app/entity_editor/EntityField/types';
import { InternalContentType } from 'app/widgets/ExtensionSDKs/createContentTypeApi';
import { createTagsRepo } from 'features/content-tags';
import { LegacyWidget } from 'widgets/WidgetCompat';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { getEnvironmentAliasesIds, getSpaceMember } from 'core/services/SpaceEnvContext/utils';
import { useCurrentSpaceAPIClient } from 'core/services/APIClient/useCurrentSpaceAPIClient';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import createCache from 'data/userCache';
import { SpaceMember } from 'classes/spaceContextTypes';
import { EditorInterfaceProps } from 'contentful-management/types';

const SnapshotPresenterRichText = ({
  className,
  value,
  entity,
  editorData,
  field,
  locale,
  widget,
  parameters,
}: SnapshotPresenterRichTextProps) => {
  const {
    currentSpaceId,
    currentEnvironment,
    currentEnvironmentId,
    currentEnvironmentAliasId,
    currentSpace,
    currentSpaceContentTypes,
  } = useSpaceEnvContext();
  const { client: spaceApiClient, plainClient } = useCurrentSpaceAPIClient();

  const sdk: FieldExtensionSDK | undefined = useMemo(() => {
    const spaceId = currentSpaceId as string;
    const aliasesId = getEnvironmentAliasesIds(currentEnvironment);
    const spaceMember = getSpaceMember(currentSpace) as SpaceMember;
    const spaceEndpoint = createSpaceEndpoint(
      spaceId,
      currentEnvironmentAliasId || currentEnvironmentId
    );
    const usersEndpoint = createCache(spaceEndpoint);
    const tagsEndpoint = createTagsRepo(
      spaceEndpoint,
      currentEnvironmentAliasId || currentEnvironmentId
    );

    if (!currentEnvironment) {
      return;
    }
    return createReadonlyFieldWidgetSDK({
      cma: spaceApiClient,
      plainCmaClient: plainClient,
      editorInterface: editorData.editorInterface,
      entry: entity,
      publicFieldId: field.apiName ?? field.id,
      fieldValue: value,
      initialContentTypes: currentSpaceContentTypes,
      internalContentType: editorData.contentType,
      publicLocaleCode: locale.code,
      spaceId,
      environment: currentEnvironment,
      allEnvironmentAliasIds: aliasesId,
      spaceMember,
      tagsRepo: tagsEndpoint,
      usersRepo: usersEndpoint,
      widgetId: widget.id,
      widgetNamespace: widget.namespace,
      parameters,
    });
  }, [
    field,
    locale,
    entity,
    editorData,
    value,
    widget,
    parameters,
    currentSpaceId,
    currentEnvironmentId,
    currentEnvironment,
    currentEnvironmentAliasId,
    currentSpace,
    currentSpaceContentTypes,
    spaceApiClient,
    plainClient,
  ]);

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
    contentType: InternalContentType;
    editorInterface: EditorInterfaceProps;
  };
  entity: Entity;
  field: Field;
  locale: Locale;
  widget: LegacyWidget;
  parameters: {
    instance: Record<string, any>;
    installation: Record<string, any>;
  };
}

SnapshotPresenterRichText.defaultProps = {
  className: '',
};

export default SnapshotPresenterRichText;
