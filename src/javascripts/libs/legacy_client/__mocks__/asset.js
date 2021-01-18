import describeEntity from './entity';
import describeArchivable from './archivable';
import {
  describeResource,
  describeGetResource,
  describeCreateResource,
  describeContentEntity,
} from './space_resource';

export default function describeAsset(context) {
  const asset = { singular: 'asset', plural: 'assets' };
  describeGetResource(asset, undefined, context);
  describeCreateResource(asset, undefined, context);
  describeContentEntity(asset, setupEntity, context);
  describeEntity(asset, setupEntity, context);
  describeArchivable(asset, setupEntity, context);

  function setupEntity() {
    beforeEach(async function () {
      context.request.respond({ sys: { type: 'Asset' } });
      context.entity = await context.space.createAsset();
    });
  }

  describeResource(
    asset,
    function () {
      it('#process()', async function () {
        context.request.respond(null);
        await context.asset.process('myversion', 'mylocale');
        expect(context.request).toHaveBeenCalledWith({
          method: 'PUT',
          url: '/spaces/42/assets/43/files/mylocale/process',
          headers: { 'X-Contentful-Version': 'myversion' },
        });
      });
    },
    context
  );
}
