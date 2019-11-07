import _ from 'lodash';
import * as SpaceEnvironmentsRepo from './SpaceEnvironmentsRepo.es6';
import * as SpaceAliasesRepo from 'data/CMA/SpaceAliasesRepo.es6';
import { createPaginationEndpoint } from '__mocks__/data/EndpointFactory.es6';

SpaceAliasesRepo.create = jest.fn().mockReturnValue({ getAll: jest.fn() });

const generateEnvs = (length, optedIn) =>
  new Array(length).fill(null).map((_, id) => ({
    sys: { id, aliases: optedIn ? [] : undefined }
  }));

const generateMockSpaceEndpoint = envs =>
  SpaceEnvironmentsRepo.create(createPaginationEndpoint(envs));

describe('SpaceEnvironmentsRepo', () => {
  it('fetches all environments, if not opted in to environment aliases', async function() {
    SpaceAliasesRepo.create().getAll.mockResolvedValue([]);
    const envs = generateEnvs(1);
    const spaceEndpoint = generateMockSpaceEndpoint(envs);
    const res = await spaceEndpoint.getAll();
    expect(res).toEqual({
      environments: envs,
      aliases: undefined
    });
  });

  it('fetches all environments, if opted in to environment aliases', async function() {
    const envs = generateEnvs(100, true);
    const aliasIdx = 0;
    delete envs[aliasIdx].sys.aliases;
    SpaceAliasesRepo.create().getAll.mockResolvedValue([envs[aliasIdx]]);
    const spaceEndpoint = generateMockSpaceEndpoint(envs);
    const res = await spaceEndpoint.getAll();
    expect(res).toEqual({
      aliases: [envs[aliasIdx]],
      environments: envs.slice(1)
    });
  });
});
