import { SpaceAPI } from '@contentful/app-sdk';
import * as K from 'core/utils/kefir';
import { toPublicEntity } from '../entityHelpers';

export function connectGetEntity(
  spaceApi: SpaceAPI,
  documentPool: any,
  lifeline: K.StreamBus<unknown>
) {
  const baseGetEntry = spaceApi.getEntry.bind(spaceApi);
  const baseGetAsset = spaceApi.getAsset.bind(spaceApi);

  const getEntry = <T extends unknown>(id: string) => {
    const doc = documentPool?.getById(id, 'Entry', lifeline.stream);
    if (doc) {
      const entity = toPublicEntity(doc.getValueAt([])) as unknown as T;
      return Promise.resolve(entity);
    }
    return baseGetEntry(id);
  };

  const getAsset = <T extends unknown>(id: string) => {
    const doc = documentPool?.getById(id, 'Asset', lifeline.stream);
    if (doc) {
      const entity = toPublicEntity(doc.getValueAt([])) as unknown as T;
      return Promise.resolve(entity);
    }
    return baseGetAsset(id);
  };

  return {
    getEntry,
    getAsset,
  };
}
