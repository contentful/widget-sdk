import { ViewType } from '@contentful/field-editor-reference/dist/types';
import { WidgetApi } from 'widgets/BuiltinWidgets';
import { StreamBus } from 'core/utils/kefir';
import { CustomActionProps } from '@contentful/field-editor-reference/dist/common/ReferenceEditor';
import React from 'react';

export interface EditorWithTrackingProps {
  viewType: ViewType;
  sdk: WidgetApi;
  loadEvents: StreamBus<any>;
  renderCustomActions: RenderCustomActions;
}

export type RenderCustomActions = (props: CustomActionProps) => React.ReactElement;
