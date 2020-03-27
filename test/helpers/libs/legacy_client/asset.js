import sinon from 'sinon';
import describeEntity from './entity';
import describeArchivable from './archivable';
import {
  describeResource,
  describeGetResource,
  describeCreateResource,
  describeContentEntity,
} from './space_resource';

export default function describeAsset() {
  const asset = { singular: 'asset', plural: 'assets' };
  describeGetResource(asset);
  describeCreateResource(asset);
  describeContentEntity(asset, setupEntity);
  describeEntity(asset, setupEntity);
  describeArchivable(asset, setupEntity);

  function setupEntity() {
    beforeEach(async function () {
      this.request.respond({ sys: { type: 'Asset' } });
      this.entity = await this.space.createAsset();
    });
  }

  describeResource(asset, function () {
    it('#process()', async function () {
      this.request.respond(null);
      await this.asset.process('myversion', 'mylocale');
      sinon.assert.calledWith(this.request, {
        method: 'PUT',
        url: '/spaces/42/assets/43/files/mylocale/process',
        headers: { 'X-Contentful-Version': 'myversion' },
      });
    });
  });
}
