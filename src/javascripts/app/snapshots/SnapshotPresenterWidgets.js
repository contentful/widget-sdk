import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { isRtlLocale } from 'utils/locales';
import { NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces';
import SnapshotPresenterArraySymbol from './SnapshotPresenterArraySymbol';
import SnapshotPresenterBoolean from './SnapshotPresenterBoolean';
import SnapshotPresenterDate from './SnapshotPresenterDate';
import SnapshotPresenterDefault from './SnapshotPresenterDefault';
import SnapshotPresenterExtension from './SnapshotPresenterExtension';
import SnapshotPresenterLink from './SnapshotPresenterLink';
import SnapshotPresenterLocation from './SnapshotPresenterLocation';
import SnapshotPresenterMarkdown from './SnapshotPresenterMarkdown';
import SnapshotPresenterRichText from './SnapshotPresenterRichText';
import SnapshotPresenterStandard from './SnapshotPresenterStandard';

const styles = {
  rtl: css({
    direction: 'rtl',
  }),
};

const SnapshotPresenterWidgets = ({
  editorData,
  entity,
  linkType,
  locale,
  type,
  value,
  widget,
}) => {
  const { field, widgetNamespace, descriptor, parameters, settings } = widget;

  if (widgetNamespace === NAMESPACE_EXTENSION) {
    return (
      <SnapshotPresenterExtension
        descriptor={descriptor}
        editorData={editorData}
        entity={entity}
        field={field}
        locale={locale}
        parameters={parameters}
      />
    );
  }

  const rtlClassName = isRtlLocale(locale.code) ? styles.rtl : '';
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
      return <SnapshotPresenterLink value={value} linkType={linkType} locale={locale} />;
    case 'RichText':
      return (
        <SnapshotPresenterRichText
          className={rtlClassName}
          value={value}
          contentType={editorData.contentType.data}
          entity={entity}
          field={field}
          locale={locale}
        />
      );
    case 'Text':
      return <SnapshotPresenterMarkdown className={rtlClassName} value={value} />;
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

SnapshotPresenterWidgets.propTypes = {
  editorData: PropTypes.shape({
    contentType: PropTypes.object,
  }).isRequired,
  entity: PropTypes.object.isRequired,
  linkType: PropTypes.string,
  value: PropTypes.any.isRequired,
  type: PropTypes.string.isRequired,
  widget: PropTypes.shape({
    field: PropTypes.oneOfType([
      PropTypes.shape({
        type: PropTypes.string,
        linkType: PropTypes.string,
      }),
      PropTypes.shape({
        type: PropTypes.string,
        items: PropTypes.shape({
          type: PropTypes.string,
          linkType: PropTypes.string,
        }),
      }),
    ]),
    widgetNamespace: PropTypes.string,
    descriptor: PropTypes.shape({
      id: PropTypes.string,
      appDefinitionId: PropTypes.string,
      src: PropTypes.string,
      srcdoc: PropTypes.string,
    }),
    parameters: PropTypes.shape({
      instance: PropTypes.object.isRequired,
      installation: PropTypes.object.isRequired,
      invocation: PropTypes.object,
    }),
    settings: PropTypes.oneOfType([
      PropTypes.shape({
        trueLabel: PropTypes.string,
        falseLabel: PropTypes.string,
      }),
      PropTypes.shape({
        format: PropTypes.string,
        ampm: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      }),
    ]),
  }).isRequired,
  locale: PropTypes.shape({
    code: PropTypes.string,
    internal_code: PropTypes.string,
  }).isRequired,
};

export default SnapshotPresenterWidgets;
