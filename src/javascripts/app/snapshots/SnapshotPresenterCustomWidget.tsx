import React, { useMemo } from 'react';

import { FieldExtensionSDK, KnownSDK } from '@contentful/app-sdk';
import { createReadonlyFieldWidgetSDK } from 'app/widgets/ExtensionSDKs';
import { Widget, WidgetLocation, WidgetRenderer } from '@contentful/widget-renderer';
import { InternalContentType } from 'app/widgets/ExtensionSDKs/createContentTypeApi';
import { createTagsRepo } from 'features/content-tags';
import { Locale } from 'app/entity_editor/EntityField/types';
import type { Entity } from '@contentful/editorial-primitives';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { getEnvironmentAliasesIds, getSpaceMember } from 'core/services/SpaceEnvContext/utils';
import { useCurrentSpaceAPIClient } from 'core/services/APIClient/useCurrentSpaceAPIClient';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import createUsersCache from 'data/userCache';
import { EditorInterfaceProps } from 'contentful-management/types';

interface SnapshotPresenterCustomWIdgetProps {
  locale: Locale;
  field: {
    apiName?: string;
    id: string;
  };
  entity: Entity;
  editorData: {
    contentType: InternalContentType;
    editorInterface: EditorInterfaceProps;
  };
  value: any;
  widget: Widget;
  parameters: {
    instance: Record<string, any>;
    installation: Record<string, any>;
  };
}

const SnapshotPresenterCustomWidget = ({
  widget,
  value,
  editorData,
  entity,
  locale,
  field,
  parameters,
}: SnapshotPresenterCustomWIdgetProps) => {
  const {
    currentSpaceId,
    currentEnvironment,
    currentEnvironmentId,
    currentSpace,
    currentSpaceContentTypes,
  } = useSpaceEnvContext();
  const { client: spaceApiClient, plainClient } = useCurrentSpaceAPIClient();

  const sdk: FieldExtensionSDK | undefined = useMemo(() => {
    const spaceId = currentSpaceId as string;
    const environmentId = currentEnvironmentId as string;
    const aliasesId = getEnvironmentAliasesIds(currentEnvironment);
    const spaceMember = getSpaceMember(currentSpace)!;
    const spaceEndpoint = createSpaceEndpoint(spaceId, environmentId);
    const usersEndpoint = createUsersCache(spaceEndpoint);
    const tagsEndpoint = createTagsRepo(spaceEndpoint, environmentId);

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
    widget,
    value,
    parameters,
    spaceApiClient,
    currentSpaceId,
    currentEnvironmentId,
    currentSpaceContentTypes,
    currentEnvironment,
    currentSpace,
    plainClient,
  ]);

  return (
    <div data-test-id="snapshot-presenter-extension">
      {sdk && (
        <WidgetRenderer
          location={WidgetLocation.ENTRY_FIELD}
          sdk={(sdk as unknown) as KnownSDK}
          widget={widget}
        />
      )}
    </div>
  );
};

SnapshotPresenterCustomWidget.defaultProps = {
  className: '',
};

export default SnapshotPresenterCustomWidget;
