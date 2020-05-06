import * as TeamRepo from './TeamRepo';
import { isEqual } from 'lodash';
import * as fake from 'test/helpers/fakeFactory';

describe('TeamRepo', () => {
  const assertEndpointCall = (request, method, path) => {
    if (request.method === method && isEqual(request.path, path)) {
      return true;
    } else {
      throw new Error('Arguments to api seemed wrong');
    }
  };

  describe('#getTeam()', () => {
    const endpointMock = jest.fn();
    const team = fake.Team();
    const getTeam = (teamId) => TeamRepo.getTeam(endpointMock, teamId);

    it('loads team by id', async function () {
      const buildMockImplementation = (result) => ({ method, path }) => {
        assertEndpointCall({ method, path }, 'GET', ['teams', team.sys.id]);
        return result;
      };

      endpointMock.mockImplementationOnce(buildMockImplementation(team));

      const result = await getTeam(team.sys.id);
      expect(endpointMock).toHaveBeenCalledTimes(1);
      expect(result).toBe(team);
      expect(result.sys.id).toBe(team.sys.id);
    });
  });

  describe('#createTeam()', () => {
    const endpointMock = jest.fn();
    const teamName = 'new team';
    const teamDescription = 'awesome new team';

    const team = fake.Team(teamName, teamDescription);
    const createTeam = ({ name, description }) =>
      TeamRepo.createTeam(endpointMock, { name, description });

    it('creates team with given name and description', async function () {
      const buildMockImplementation = (result) => ({ method, path }) => {
        assertEndpointCall({ method, path }, 'POST', ['teams']);
        return result;
      };

      endpointMock.mockImplementationOnce(buildMockImplementation(team));

      const result = await createTeam({ teamName, teamDescription });
      expect(endpointMock).toHaveBeenCalledTimes(1);
      expect(result).toBe(team);
      expect(result.name).toBe(teamName);
      expect(result.description).toBe(teamDescription);
    });
  });

  describe('#updateTeam()', () => {
    const endpointMock = jest.fn();
    const teamName = 'new team';
    const teamDescription = 'awesome updated new team description';

    const team = fake.Team(teamName, teamDescription);
    const updateTeam = ({ name, description, sys }) =>
      TeamRepo.updateTeam(endpointMock, { name, description, sys });

    it('updates team with given name and description by teamId', async function () {
      const buildMockImplementation = (result) => ({ method, path }) => {
        assertEndpointCall({ method, path }, 'PUT', ['teams', team.sys.id]);
        return result;
      };

      endpointMock.mockImplementationOnce(buildMockImplementation(team));

      const result = await updateTeam({ teamName, teamDescription, sys: team.sys });
      expect(endpointMock).toHaveBeenCalledTimes(1);
      expect(result).toBe(team);
      expect(result.name).toBe(teamName);
      expect(result.description).toBe(teamDescription);
    });
  });

  describe('#removeTeam()', () => {
    const endpointMock = jest.fn();

    const team = fake.Team();
    const removeTeam = (teamId) => TeamRepo.removeTeam(endpointMock, teamId);

    it('removes team with given id from org', async function () {
      const buildMockImplementation = (result) => ({ method, path }) => {
        assertEndpointCall({ method, path }, 'DELETE', ['teams', team.sys.id]);
        return result;
      };

      endpointMock.mockImplementationOnce(buildMockImplementation(null));

      const result = await removeTeam(team.sys.id);
      expect(endpointMock).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });
});
