import React from 'react';
import { render } from '@testing-library/react';
import SnapshotPresenterWidgets from './SnapshotPresenterWidgets';
import { EditorInterface, WidgetNamespace } from '@contentful/widget-renderer';
import { Entity } from '../entity_editor/Document/types';
import { Field, Locale } from '../entity_editor/EntityField/types';
import { InternalContentType } from '../widgets/createFieldWidgetSDK/createContentTypeApi';
import { LegacyWidget } from '../../widgets/WidgetCompat';

// This cannot be moved or replaced by a function because of how jest.mock works
jest.mock('./SnapshotPresenterCustomWidget', () => () => (
  <div data-test-id="SnapshotPresenterCustomWidget" />
));
jest.mock('./SnapshotPresenterArraySymbol', () => () => (
  <div data-test-id="SnapshotPresenterArraySymbol" />
));
jest.mock('./SnapshotPresenterBoolean', () => () => (
  <div data-test-id="SnapshotPresenterBoolean" />
));
jest.mock('./SnapshotPresenterDate', () => () => <div data-test-id="SnapshotPresenterDate" />);
jest.mock('./SnapshotPresenterLocation', () => () => (
  <div data-test-id="SnapshotPresenterLocation" />
));
jest.mock('./SnapshotPresenterLink', () => () => <div data-test-id="SnapshotPresenterLink" />);
jest.mock('./SnapshotPresenterRichText', () => () => (
  <div data-test-id="SnapshotPresenterRichText" />
));
jest.mock('./SnapshotPresenterStandard', () => () => (
  <div data-test-id="SnapshotPresenterStandard" />
));
jest.mock('./SnapshotPresenterMarkdown', () => () => (
  <div data-test-id="SnapshotPresenterMarkdown" />
));
jest.mock('./SnapshotPresenterDefault', () => () => (
  <div data-test-id="SnapshotPresenterDefault" />
));

const getMockedProps = ({
  widgetNamespace = WidgetNamespace.BUILTIN,
  widgetId = 'id',
}: any = {}) => {
  return {
    widget: {
      widgetNamespace,
      descriptor: ({
        locations: [],
        installationParameters: {
          definitions: {},
        },
      } as unknown) as LegacyWidget,
      field: {} as Field,
      settings: {},
      widgetId,
      parameters: {
        installation: {},
        instance: {},
      },
    },
    editorData: {
      contentType: { data: {} as InternalContentType },
      editorInterface: {} as EditorInterface,
    },
    entity: {} as Entity,
    locale: {} as Locale,
  };
};

describe('SnapshotPresenterWidgets', () => {
  describe('when presenting custom widget', () => {
    it('renders SnapshotPresenterCustomWidget', () => {
      const { widget, editorData, entity, locale } = getMockedProps({
        widgetNamespace: WidgetNamespace.EXTENSION,
      });

      const snapshotPresenterWidgets = render(
        <SnapshotPresenterWidgets
          editorData={editorData}
          value={{}}
          entity={entity}
          locale={locale}
          widget={widget}
        />
      );

      expect(
        snapshotPresenterWidgets.queryByTestId('SnapshotPresenterCustomWidget')
      ).not.toBeNull();
    });
  });

  describe('when presenting builtin widgets', () => {
    const typeConfigs = {
      'Array<Symbol>': [{ props: {}, component: 'SnapshotPresenterArraySymbol' }],
      Boolean: [{ props: {}, component: 'SnapshotPresenterBoolean' }],
      Date: [{ props: {}, component: 'SnapshotPresenterDate' }],
      Location: [{ props: {}, component: 'SnapshotPresenterLocation' }],
      Reference: [{ props: {}, component: 'SnapshotPresenterLink' }],
      RichText: [{ props: {}, component: 'SnapshotPresenterRichText' }],
      Text: [
        { props: {}, component: 'SnapshotPresenterStandard' },
        { props: { widgetId: 'markdown' }, component: 'SnapshotPresenterMarkdown' },
      ],
      Integer: [{ props: {}, component: 'SnapshotPresenterStandard' }],
      Number: [{ props: {}, component: 'SnapshotPresenterStandard' }],
      Symbol: [{ props: {}, component: 'SnapshotPresenterStandard' }],
    };

    for (const [type, configs] of Object.entries(typeConfigs)) {
      for (const config of configs) {
        const { props, component } = config;

        it(`renders ${component} for ${type}`, () => {
          const { widget, editorData, entity, locale } = getMockedProps(props);

          const snapshotPresenterWidgets = render(
            <SnapshotPresenterWidgets
              editorData={editorData}
              value={{}}
              entity={entity}
              locale={locale}
              widget={widget}
              type={type}
            />
          );

          expect(snapshotPresenterWidgets.queryByTestId(`${component}`)).not.toBeNull();
        });
      }
    }

    it('renders SnapshotPresenterDefault with unknown type', () => {
      const { widget, editorData, entity, locale } = getMockedProps();

      const snapshotPresenterWidgets = render(
        <SnapshotPresenterWidgets
          editorData={editorData}
          value={{}}
          entity={entity}
          locale={locale}
          widget={widget}
          type={'unknown'}
        />
      );

      expect(snapshotPresenterWidgets.queryByTestId('SnapshotPresenterDefault')).not.toBeNull();
    });
  });
});
