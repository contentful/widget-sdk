import { renderHook } from '@testing-library/react-hooks';
import { useContentTypeTracking } from './useContentTypeTracking';
import { tracking } from 'analytics/Analytics';
import { ContentType, EditorInterface } from 'core/typings';

jest.mock('analytics/Analytics', () => ({
  tracking: {
    editorInterfaceFieldUpdated: jest.fn(),
  },
}));
type TrackingMock = {
  editorInterfaceFieldUpdated: jest.Mock<typeof tracking.editorInterfaceFieldUpdated>;
};

describe('useContentTypeTracking', () => {
  const hookParams = {
    currentOrganizationId: 'test-org',
    currentSpaceId: 'test-space',
    currentResolvedEnvironmentId: 'test-env',
  };
  let trackingMock: TrackingMock;

  beforeEach(() => {
    jest.resetAllMocks();
    trackingMock = tracking as any as TrackingMock;
  });

  it(`does not track non-builtin widgets`, () => {
    const contentType = {
      sys: { id: 'test-ct' },
      fields: [{ id: 'second' }],
    } as ContentType;
    const editorInterface = {
      controls: [
        { fieldId: 'first', widgetNamespace: 'other-namespace' },
        { fieldId: 'second', widgetNamespace: 'builtin', widgetId: 'slugEditor' },
      ],
    } as EditorInterface;

    const { result } = renderHook(() => useContentTypeTracking(hookParams));
    result.current.fieldsUpdated(contentType, editorInterface);

    expect(trackingMock.editorInterfaceFieldUpdated).toHaveBeenCalledTimes(1);
    expect(trackingMock.editorInterfaceFieldUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ field_id: 'second' })
    );
  });

  it(`adds context info about org, space & env`, () => {
    const contentType = {
      sys: { id: 'test-ct' },
      fields: [{ id: 'second' }],
    } as ContentType;
    const editorInterface = {
      controls: [{ fieldId: 'second', widgetNamespace: 'builtin', widgetId: 'slugEditor' }],
    } as EditorInterface;

    const { result } = renderHook(() => useContentTypeTracking(hookParams));
    result.current.fieldsUpdated(contentType, editorInterface);

    expect(trackingMock.editorInterfaceFieldUpdated).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_key: hookParams.currentOrganizationId,
        space_key: hookParams.currentSpaceId,
        environment_key: hookParams.currentResolvedEnvironmentId,
      })
    );
  });

  it(`adds info about appearance and field type`, () => {
    const contentTypeId = 'test-ct';
    const fieldType = 'Foobar';
    const fieldId = 'second';
    const widgetId = 'slugEditor';
    const widgetSettings = {};
    const contentType = {
      sys: { id: contentTypeId },
      fields: [{ id: fieldId, type: fieldType }],
    } as ContentType;
    const editorInterface = {
      controls: [
        { fieldId: fieldId, widgetNamespace: 'builtin', widgetId, settings: widgetSettings },
      ],
    } as EditorInterface;

    const { result } = renderHook(() => useContentTypeTracking(hookParams));
    result.current.fieldsUpdated(contentType, editorInterface);

    expect(trackingMock.editorInterfaceFieldUpdated).toHaveBeenCalledWith(
      expect.objectContaining({
        content_type_id: contentTypeId,
        field_id: fieldId,
        field_type: fieldType,
        widget_id: widgetId,
        field_settings: widgetSettings,
      })
    );
  });
});
