import { SlideInEditor } from './SlideInEditor/SlideInEditor';

const baseDetails = {
  name: 'detail',
  params: { addToContext: true },
  component: SlideInEditor,
};

export function entryDetail(children) {
  return {
    ...baseDetails,
    url: '/:entryId?previousEntries&bulkEditor&tab',
    children: children,
  };
}

export function assetDetail() {
  return {
    ...baseDetails,
    url: '/:assetId?previousEntries&tab',
  };
}
