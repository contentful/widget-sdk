import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { EntityField } from './EntityField';
import { EntityType } from '@contentful/app-sdk';
import ShareJsDocMock from '../Document/__mocks__/ShareJsDocMock';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';

jest.mock('app/entity_editor/fieldLocaleController', () => ({
  createFieldLocaleController: jest.fn().mockReturnValue({
    revalidate: jest.fn(),
  }),
}));

jest.mock('app/widgets/ExtensionSDKs', () => ({
  createFieldWidgetSDK: jest.fn().mockReturnValue({}),
}));

jest.mock('app/entity_editor/WidgetRenderer', () => ({
  WidgetRenderer: jest.fn(({ onBlur, onFocus }) => (
    <div onBlur={onBlur} onFocus={onFocus} tabIndex={1} data-test-id="widget-renderer" />
  )),
}));

jest.mock('@contentful/field-editor-validation-errors', () => ({
  ValidationErrors: jest.fn(() => <div data-test-id="validation-errors" />),
}));

const getLocale = (overrides = {} as any) => {
  const name = overrides.name || 'de-DE';
  return {
    name,
    // eslint-disable-next-line @typescript-eslint/camelcase
    internal_code: name,
    code: name,
    fallbackCode: overrides.name ? 'de-DE' : undefined,
    default: true,
    contentManagementApi: false,
    contentDeliveryApi: false,
    optional: false,
    sys: {
      id: name,
    },
    ...overrides,
  };
};

const renderComponent = (override = (props) => props) => {
  const defaultProps = {
    doc: ShareJsDocMock(),
    widget: {
      fieldId: 'widget-field-id',
      isVisible: true,
      isFocusable: true,
      settings: { helpText: 'help-text' },
      field: {
        id: 'field-id',
        name: 'Field',
        apiName: 'field',
        type: '',
        disabled: false,
        required: false,
        localized: true,
        items: {
          type: 'type',
        },
      },
    },
    index: 0,
    localeData: {
      isSingleLocaleModeOn: false,
      focusedLocale: getLocale(),
      defaultLocale: getLocale(),
      privateLocales: [
        getLocale(),
        getLocale({ name: 'en-US' }),
        getLocale({ name: 'it' }),
        getLocale({ name: 'fr' }),
      ],
      isLocaleActive: jest.fn(({ name }) => name != 'it'),
    },
    editorContext: {
      hasInitialFocus: true,
      validator: {
        /* eslint-disable @typescript-eslint/camelcase */
        hasFieldLocaleError: jest.fn((_, { internal_code }) => internal_code == 'fr'),
        hasFieldError: jest.fn().mockReturnValue(false),
        /* eslint-enable @typescript-eslint/camelcase */
      },
      entityInfo: {
        type: 'Entry' as EntityType,
        contentType: {
          name: 'ct-1',
          sys: {
            id: 'ct-1',
          },
        },
      },
    },
    editorData: {
      entityInfo: {
        type: 'Entry' as EntityType,
        contentType: {
          name: 'ct-1',
          sys: {
            id: 'ct-1',
          },
        },
      },
    },
    fieldLocaleListeners: {
      lookup: {},
      flat: [],
    },
    loadEvents: undefined,
    preferences: {
      showDisabledFields: false,
    },
  };

  return render(
    <SpaceEnvContext.Provider
      value={{
        currentSpaceId: 'space-id',
        currentEnvironmentId: 'environment-id',
        currentSpaceContentTypes: [],
      }}>
      <EntityField {...override(defaultProps)} />
    </SpaceEnvContext.Provider>
  );
};

describe('EntityField', () => {
  it('renders nothing when invisible', () => {
    const { queryByTestId } = renderComponent((props) => {
      props.widget.isVisible = false;
      return props;
    });
    expect(queryByTestId('entity-field-controls')).not.toBeTruthy();
  });

  it('renders field multiple times with active locales and helptext', () => {
    const { queryByTestId } = renderComponent();
    expect(queryByTestId('entity-field-controls')).toBeTruthy();
    expect(queryByTestId('entity-field-locale-de-DE')).toBeTruthy();
    expect(queryByTestId('entity-field-locale-en-US')).toBeTruthy();
    // locale not active
    expect(queryByTestId('entity-field-locale-it')).not.toBeTruthy();

    expect(queryByTestId('field-hint')?.innerHTML).toBe('help-text');
  });

  it('renders field multiple times without helptext', () => {
    const { queryByTestId } = renderComponent((props) => {
      props.widget.settings = undefined;
      return props;
    });

    expect(queryByTestId('field-hint')).not.toBeTruthy();
  });

  it('renders field only once with default locale when singleLocaleMode is on', () => {
    const { queryByTestId } = renderComponent((props) => {
      props.localeData.isSingleLocaleModeOn = true;
      return props;
    });
    expect(queryByTestId('entity-field-controls')).toBeTruthy();
    expect(queryByTestId('entity-field-locale-de-DE')).toBeTruthy();
    expect(queryByTestId('entity-field-locale-en-US')).not.toBeTruthy();
    expect(queryByTestId('entity-field-locale-it')).not.toBeTruthy();

    expect(queryByTestId('field-hint')?.innerHTML).toBe('help-text');
  });

  it('renders field marked with error', () => {
    const { queryByTestId } = renderComponent((props) => {
      props.editorContext.validator.hasFieldError = jest.fn().mockReturnValue(true);
      return props;
    });

    const wrapper = queryByTestId('entity-field-controls');
    expect(wrapper).toBeTruthy();
    expect(wrapper?.getAttribute('aria-invalid')).toBe('true');
    expect(queryByTestId('entity-field-locale-de-DE')).toBeTruthy();

    expect(queryByTestId('field-hint')?.innerHTML).toBe('help-text');
  });

  it('sets focused and unfocused state', async () => {
    const { queryByTestId } = renderComponent((props) => {
      props.localeData.isSingleLocaleModeOn = true;
      return props;
    });

    const renderer = queryByTestId('widget-renderer');
    expect(renderer).toBeTruthy();

    expect(queryByTestId('entity-field-controls')?.getAttribute('aria-current')).toBe('false');
    renderer?.focus();
    await waitFor(() =>
      expect(queryByTestId('entity-field-controls')?.getAttribute('aria-current')).toBe('true')
    );
    renderer?.blur();
    await waitFor(() =>
      expect(queryByTestId('entity-field-controls')?.getAttribute('aria-current')).toBe('false')
    );
  });
});
