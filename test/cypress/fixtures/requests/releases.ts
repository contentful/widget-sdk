import { defaultAssetId } from '../../util/requests';

export const deleteEntityBodyRequest = () => ({
  title: 'Twentieth Release',
  entities: {
    sys: { type: 'Array' },
    items: [{ sys: { id: defaultAssetId, linkType: 'Asset', type: 'Link' } }],
  },
});

export const createReleaseRequest = () => ({
  title: 'New Release',
  entities: {
    sys: { type: 'Array' },
    items: [],
  },
});
