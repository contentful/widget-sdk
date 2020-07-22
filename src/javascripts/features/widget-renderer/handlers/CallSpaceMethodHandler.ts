import { WidgetRendererProps } from '../WidgetRenderer';

export const makeCallSpaceMethodHandler = (
  spaceApi: WidgetRendererProps['apis']['space'],
  handlerOptions: { readOnly?: boolean } = {}
) =>
  async function (methodName, args = []) {
    if (handlerOptions.readOnly === true) {
      // TODO: create a whitelist
      // When rendering an extension in the read-only mode we disable
      // any mutating CMA calls. This is used in snapshots right now.
      if (typeof methodName !== 'string' || !methodName.startsWith('get')) {
        throw new Error('Cannot modify data in read-only mode.');
      }
    }

    if (!spaceApi[methodName]) {
      throw new RangeError(`Unknown method ${methodName}`);
    }

    try {
      const entity = await spaceApi[methodName](...args);
      // TODO:
      // maybeTrackEntryAction(methodName, args, entity);
      return entity;
    } catch ({ code, body }) {
      const err = new Error('Request failed.');
      throw Object.assign(err, { code, data: body });
    }
  };
