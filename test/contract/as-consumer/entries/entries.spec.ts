import { Provider } from '@contentful/pact-node-utils';
import { defaultEntryId } from '../../../cypress/util/requests';
import { willSucceedGettingDefaultEntry } from './interactions';
import { getServerAndClient } from './utils';

type Await<T> = T extends PromiseLike<infer U> ? U : T;
type AwaitedServerAndClient = Await<ReturnType<typeof getServerAndClient>>;

describe('EntityRepo', () => {
  let server: AwaitedServerAndClient['server'];
  let client: AwaitedServerAndClient['entityRepo'];
  let entriesEndpoint: Provider;

  beforeEach(async () => {
    const result = await getServerAndClient();

    server = result.server;
    client = result.entityRepo;

    await server.removeInteractions();

    entriesEndpoint = await server.provider('entries');
  });

  afterEach(async () => {
    await server.verifyAndRemoveInteractions();
    await server.writePactsAndShutdown();
  });

  describe('GET requests', () => {
    describe('when requesting the default entry using the entity repo', () => {
      describe('and getting a success response', () => {
        it('returns the default entry', async () => {
          await entriesEndpoint.addInteraction(willSucceedGettingDefaultEntry());
          const entry = await client.get('Entry', defaultEntryId);
          expect(entry.sys.id).toBe(defaultEntryId);
        });
      });
    });
  });

  // eslint-disable-next-line jest/no-disabled-tests
  describe.skip('PATCH requests', () => {
    describe('when requesting the default entry using the entity repo', () => {
      describe('and getting a success response', () => {
        it('returns the default entry', async () => {
          await entriesEndpoint.addInteraction(willSucceedGettingDefaultEntry());
          await entriesEndpoint.addInteraction(willSucceedPatchingDefaultEntry());
          const entry = await client.get('Entry', defaultEntryId);
          const newEntry = await client.patch(entry, {
            ...entry,
            fields: {
              ...entry.fields,
              fieldId: { 'en-US': 'updated-field-id' },
            },
          });
          expect(newEntry.sys.id).toBe(defaultEntryId);
          expect(newEntry.sys.version).toBe(2);
        });
      });
    });
  });
});
