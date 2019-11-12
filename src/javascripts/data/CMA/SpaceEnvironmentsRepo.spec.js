import _ from 'lodash';
import * as SpaceEnvironmentsRepo from './SpaceEnvironmentsRepo';
import * as SpaceAliasesRepo from 'data/CMA/SpaceAliasesRepo';
import { createPaginationEndpoint } from '__mocks__/data/EndpointFactory';

SpaceAliasesRepo.create = jest.fn().mockReturnValue({ getAll: jest.fn() });

const generateEnvs = (length, optedIn) =>
  new Array(length).fill(null).map((_, id) => ({
    sys: { id, aliases: optedIn ? [] : undefined }
  }));

const generateMockSpaceEndpoint = envs =>
  SpaceEnvironmentsRepo.create(createPaginationEndpoint(envs));

describe('SpaceEnvironmentsRepo', () => {
  it('fetches all environments, if not opted in to environment aliases', async function() {
    const envs = generateEnvs(1);
    const spaceEndpoint = generateMockSpaceEndpoint(envs);
    const res = await spaceEndpoint.getAll();
    expect(res).toEqual({ environments: envs });
  });

  it('fetches all environments, if opted in to environment aliases', async function() {
    const envs = generateEnvs(SpaceEnvironmentsRepo.ENVIRONMENTS_LIMIT - 1, true);
    const aliasIdx = 0;
    delete envs[aliasIdx].sys.aliases;
    const spaceEndpoint = generateMockSpaceEndpoint(envs);
    const res = await spaceEndpoint.getAll();
    expect(res).toEqual({
      aliases: [envs[aliasIdx]],
      environments: envs.slice(1)
    });
  });
});
