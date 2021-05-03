import React from 'react';
import { css } from 'emotion';

import { isRtlLocale } from 'utils/locales';
import SnapshotPresenterArraySymbol from './SnapshotPresenterArraySymbol';
import SnapshotPresenterBoolean from './SnapshotPresenterBoolean';
import SnapshotPresenterDate from './SnapshotPresenterDate';
import SnapshotPresenterDefault from './SnapshotPresenterDefault';
import SnapshotPresenterCustomWidget from './SnapshotPresenterCustomWidget';
import SnapshotPresenterLink from './SnapshotPresenterLink';
import SnapshotPresenterLocation from './SnapshotPresenterLocation';
import SnapshotPresenterMarkdown from './SnapshotPresenterMarkdown';
import SnapshotPresenterRichText from './SnapshotPresenterRichText';
import SnapshotPresenterStandard from './SnapshotPresenterStandard';
import { isCustomWidget, WidgetNamespace } from '@contentful/widget-renderer';
import { LegacyWidget, toRendererWidget } from 'widgets/WidgetCompat';
import type { Entity } from '@contentful/editorial-primitives';
import { Field, Locale } from 'app/entity_editor/EntityField/types';
import { InternalContentType } from 'app/widgets/ExtensionSDKs/createContentTypeApi';
import { EditorInterfaceProps } from 'contentful-management/types';

const styles = {
  rtl: css({
    direction: 'rtl',
  }),
};

interface SnapshotPresenterWidgetsProps {
  editorData: {
    contentType: { data: InternalContentType };
    editorInterface: EditorInterfaceProps;
  };
  entity: Entity;
  linkType?: string;
  value: any;
  type?: string;
  widget: {
    descriptor: LegacyWidget;
    field: Field;
    settings: any;
    widgetNamespace: WidgetNamespace;
    widgetId: string;
    parameters: {
      instance: Record<string, any>;
      installation: Record<string, any>;
    };
  };
  locale: Locale;
}

const SnapshotPresenterWidgets = ({
  editorData,
  entity,
  linkType,
  locale,
  type,
  value,
  widget,
}: SnapshotPresenterWidgetsProps) => {
  const { field, descriptor, widgetNamespace, parameters, settings } = widget;

  if (isCustomWidget(widgetNamespace)) {
    return (
      <SnapshotPresenterCustomWidget
        editorData={editorData}
        entity={entity}
        field={field}
        locale={locale}
        value={value}
        parameters={parameters}
        widget={toRendererWidget(descriptor)}
      />
    );
  }

  const isRtl = isRtlLocale(locale.code);
  const rtlClassName = isRtl ? styles.rtl : '';

  switch (type) {
    case 'Array<Symbol>':
      return <SnapshotPresenterArraySymbol className={rtlClassName} value={value} />;
    case 'Boolean':
      return <SnapshotPresenterBoolean value={value} settings={settings} />;
    case 'Date':
      return <SnapshotPresenterDate value={value} settings={settings} />;
    case 'Location':
      return <SnapshotPresenterLocation value={value} />;
    case 'Reference':
      return <SnapshotPresenterLink value={value} linkType={linkType as string} locale={locale} />;
    case 'RichText':
      return (
        <SnapshotPresenterRichText
          className={rtlClassName}
          editorData={editorData}
          entity={entity}
          field={field}
          locale={locale}
          value={value}
          widget={descriptor}
          parameters={parameters}
        />
      );
    case 'Text':
      return widget.widgetId === 'markdown' ? (
        <SnapshotPresenterMarkdown direction={isRtl ? 'rtl' : 'ltr'} value={value} />
      ) : (
        <SnapshotPresenterStandard className={rtlClassName} value={value} />
      );
    case 'Integer':
      return <SnapshotPresenterStandard value={value} />;
    case 'Number':
      return <SnapshotPresenterStandard value={value} />;
    case 'Symbol':
      return <SnapshotPresenterStandard className={rtlClassName} value={value} />;
    default:
      return <SnapshotPresenterDefault value={value} />;
  }
};

export default SnapshotPresenterWidgets;
