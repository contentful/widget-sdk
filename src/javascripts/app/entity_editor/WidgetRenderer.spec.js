import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { WidgetRenderer } from './WidgetRenderer';
import * as WidgetRendererExternal from '@contentful/widget-renderer';
import * as LoadEventTracker from 'app/entity_editor/LoadEventTracker';

jest.mock('widgets/WidgetCompat', () => ({
  toRendererWidget: jest.fn(),
}));

jest.mock('states/deeplink/utils', () => ({
  getOrg: () => ({ orgId: 'test' }),
}));

jest.mock('services/TokenStore', () => ({
  getUser: () => ({ sys: { id: 'test' } }),
}));

jest.mock('app/entity_editor/LoadEventTracker');
const trackLinksRendered = jest.fn();
LoadEventTracker.createLinksRenderedEvent = jest.fn().mockReturnValue(trackLinksRendered);
const handleWidgetLinkRenderEvents = jest.fn();
LoadEventTracker.createWidgetLinkRenderEventsHandler = jest
  .fn()
  .mockReturnValue(handleWidgetLinkRenderEvents);

jest.mock('@contentful/widget-renderer');
WidgetRendererExternal.isCustomWidget = jest.fn().mockReturnValue(false);
WidgetRendererExternal.WidgetRenderer = () => <div data-test-id="widget-renderer" />;
WidgetRendererExternal.WidgetNamespace = { BUILTIN: 'BUILTIN' };
WidgetRendererExternal.WidgetLocation = { ENTRY_FIELD: 'ENTRY_FIELD' };

let props;
const renderComponent = (patchProps = (props) => props) => {
  props = patchProps({
    isRtl: true,
    hasInitialFocus: true,
    locale: {
      name: 'English',
      internal_code: 'en-US',
      code: 'en-US',
      fallbackCode: null,
      default: true,
      contentManagementApi: false,
      contentDeliveryApi: false,
      optional: false,
      sys: {
        id: 'id',
      },
    },
    widget: {
      fieldId: 'fieldId',
      isVisible: false,
      isFocusable: false,
      widgetNamespace: WidgetRendererExternal.WidgetNamespace.BUILTIN,
      renderFieldEditor: jest.fn(() => (
        <div data-test-id="field-editor">
          <input data-test-id="input" />
        </div>
      )),
      field: {
        id: 'id',
        name: 'name',
        apiName: 'apiName',
        type: 'type',
        disabled: false,
        required: false,
        localized: false,
        items: {
          type: 'type',
        },
      },
      settings: {
        helpText: 'helpText',
      },
    },
    onFocus: jest.fn(),
    onBlur: jest.fn(),
    loadEvents: undefined,
    widgetApi: {},
    entityType: 'Entry',
  });
  return render(<WidgetRenderer {...props} />);
};

describe('WidgetRenderer', () => {
  it('should render the component without tracking', () => {
    const { queryByTestId } = renderComponent();
    expect(queryByTestId('field-editor')).toBeTruthy();
    expect(queryByTestId('widget-renderer')).not.toBeTruthy();
    expect(queryByTestId('widget-renderer-warning')).not.toBeTruthy();

    expect(trackLinksRendered).not.toHaveBeenCalled();
    expect(handleWidgetLinkRenderEvents).not.toHaveBeenCalled();
  });

  it('should render the component with the first input focused', async () => {
    const { queryByTestId } = renderComponent();
    await waitFor(() => expect(queryByTestId('input')).toHaveFocus());
    expect(props.onFocus).toHaveBeenCalledTimes(1);
  });

  it('should render the memoized renderer on rerender :D', async () => {
    const { queryByTestId, rerender, container } = renderComponent((props) => {
      props.loadEvents = {};
      return props;
    });

    expect(queryByTestId('field-editor')).toBeTruthy();
    expect(queryByTestId('widget-renderer')).not.toBeTruthy();
    expect(queryByTestId('widget-renderer-warning')).not.toBeTruthy();

    expect(queryByTestId('field-editor')).toBeTruthy();

    expect(container.querySelector('.x--dir-rtl')).toBeTruthy();

    expect(trackLinksRendered).not.toHaveBeenCalled();
    expect(handleWidgetLinkRenderEvents).toHaveBeenCalledTimes(1);

    rerender(<WidgetRenderer {...props} isRtl={false} />);

    expect(container.querySelector('.x--dir-rtl')).not.toBeTruthy();

    expect(trackLinksRendered).not.toHaveBeenCalled();
    expect(handleWidgetLinkRenderEvents).toHaveBeenCalledTimes(1);
  });

  describe('tracking', () => {
    it('should track load events for field editor', () => {
      const { queryByTestId } = renderComponent((props) => {
        props.loadEvents = {};
        return props;
      });
      expect(queryByTestId('field-editor')).toBeTruthy();
      expect(queryByTestId('widget-renderer')).not.toBeTruthy();
      expect(queryByTestId('widget-renderer-warning')).not.toBeTruthy();

      expect(trackLinksRendered).not.toHaveBeenCalled();
      expect(handleWidgetLinkRenderEvents).toHaveBeenCalledTimes(1);
    });

    it('should track load events for widget renderer', () => {
      WidgetRendererExternal.isCustomWidget = jest.fn().mockReturnValue(true);

      const { queryByTestId } = renderComponent((props) => {
        props.widget.widgetNamespace = `NOT_${WidgetRendererExternal.WidgetNamespace.BUILTIN}`;
        props.loadEvents = {};
        return props;
      });

      expect(queryByTestId('field-editor')).not.toBeTruthy();
      expect(queryByTestId('widget-renderer')).toBeTruthy();
      expect(queryByTestId('widget-renderer-warning')).not.toBeTruthy();

      expect(trackLinksRendered).toHaveBeenCalledTimes(1);
      expect(handleWidgetLinkRenderEvents).not.toHaveBeenCalled();
    });

    it('should track load events for widget renderer warning', () => {
      const { queryByTestId } = renderComponent((props) => {
        props.loadEvents = {};
        props.widget.problem = {};
        return props;
      });

      expect(queryByTestId('field-editor')).not.toBeTruthy();
      expect(queryByTestId('widget-renderer')).not.toBeTruthy();
      expect(queryByTestId('widget-renderer-warning')).toBeTruthy();

      expect(trackLinksRendered).toHaveBeenCalledTimes(1);
      expect(handleWidgetLinkRenderEvents).not.toHaveBeenCalled();
    });

    it('should show a warning when the app couldnt be loaded', () => {
      const { queryByTestId } = renderComponent((props) => {
        props.widget.problem = 'missing';
        return props;
      });

      expect(queryByTestId('widget-renderer-warning')).toBeTruthy();
    });

    it('when the server returns an error a cta should be rendered', () => {
      const { queryByTestId } = renderComponent((props) => {
        props.widget.problem = 'internal_error';
        return props;
      });

      expect(screen.getByText('Use default field editor this time')).toBeTruthy();
      expect(queryByTestId('widget-renderer-warning')).toBeTruthy();
    });
  });
});
