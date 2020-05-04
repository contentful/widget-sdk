import * as TeamRepo from './TeamRepo';
import { isEqual } from 'lodash';
import * as fake from 'test/helpers/fakeFactory';

describe('TeamRepo', () => {
  describe('#getTeam()', () => {
    const endpointMock = jest.fn();
    const team = fake.Team();
    const teamId = 'Team1';
    const getTeam = (teamId) => TeamRepo.getTeam(endpointMock, teamId);

    it('loads team by id', async function () {
      const buildMockImplementation = (result) => ({ method, path }) => {
        if (method === 'GET' && isEqual(path, ['teams', teamId])) {
          return result;
        } else {
          throw new Error('Arguments to api seemed wrong');
        }
      };

      endpointMock.mockImplementationOnce(buildMockImplementation(team));

      const result = await getTeam(teamId);
      expect(endpointMock).toHaveBeenCalledTimes(1);
      expect(result).toBe(team);
      expect(result.sys.id).toBe(teamId);
    });
  });
});
