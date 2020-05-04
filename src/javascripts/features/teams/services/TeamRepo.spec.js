import * as TeamRepo from './TeamRepo';
import { isEqual } from 'lodash';
import * as fake from 'test/helpers/fakeFactory';

describe('TeamRepo', () => {
  describe('#getTeam()', () => {
    const endpointMock = jest.fn();
    const team = fake.Team();
    const getTeam = (teamId) => TeamRepo.getTeam(endpointMock, teamId);

    it('loads team by id', async function () {
      const buildMockImplementation = (result) => ({ method, path }) => {
        if (method === 'GET' && isEqual(path, ['teams', team.sys.id])) {
          return result;
        } else {
          throw new Error('Arguments to api seemed wrong');
        }
      };

      endpointMock.mockImplementationOnce(buildMockImplementation(team));

      const result = await getTeam(team.sys.id);
      expect(endpointMock).toHaveBeenCalledTimes(1);
      expect(result).toBe(team);
      expect(result.sys.id).toBe(team.sys.id);
    });
  });

  // describe('#getAllTeams()', () => {
  //   const endpointMock = jest.fn();
  //   const teamIds = times(100, (i) => `Team${i}`);
  //   const teams = teamIds.map(() => fake.Team());
  //   const getAllTeams = () => TeamRepo.getAllTeams(endpointMock);

  //   it('loads all teams', async function () {
  //     const buildMockImplementation = (result) => ({ method, path }) => {
  //       if (method === 'GET' && isEqual(path, ['teams'])) {
  //         return result;
  //       } else {
  //         throw new Error('Arguments to api seemed wrong');
  //       }
  //     };

  //     endpointMock.mockImplementationOnce(buildMockImplementation(teams));

  //     const result = await getAllTeams();
  //     console.log(result);
  //     expect(endpointMock).toHaveBeenCalledTimes(1);
  //     expect(result.items).toBe(teams);
  //     expect(result.items.length).toBe(100);
  //   });
  // });

  describe('#createTeam()', () => {
    const endpointMock = jest.fn();
    const teamName = 'new team';
    const teamDescription = 'awesome new team';

    const team = fake.Team(teamName, teamDescription);
    const createTeam = ({ name, description }) =>
      TeamRepo.createTeam(endpointMock, { name, description });

    it('creates team with given name and description', async function () {
      const buildMockImplementation = (result) => ({ method, path }) => {
        if (method === 'POST' && isEqual(path, ['teams'])) {
          return result;
        } else {
          throw new Error('Arguments to api seemed wrong');
        }
      };

      endpointMock.mockImplementationOnce(buildMockImplementation(team));

      const result = await createTeam({ teamName, teamDescription });
      console.log(result);
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
        if (method === 'PUT' && isEqual(path, ['teams', team.sys.id])) {
          return result;
        } else {
          throw new Error('Arguments to api seemed wrong');
        }
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
        if (method === 'DELETE' && isEqual(path, ['teams', team.sys.id])) {
          return result;
        } else {
          throw new Error('Arguments to api seemed wrong');
        }
      };

      endpointMock.mockImplementationOnce(buildMockImplementation(null));

      const result = await removeTeam(team.sys.id);
      expect(endpointMock).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });
});
