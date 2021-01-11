import * as Endpoint from 'data/Endpoint';

const EndpointFactory = jest.requireActual('data/EndpointFactory');

jest.mock('Authentication');
jest.mock('Config', () => ({ apiUrl: jest.fn().mockReturnValue('API_URL') }));
jest.mock('data/Endpoint');

describe('data/EndpointFactory', () => {
  describe('#createOrganizationEndpoint', () => {
    it('delegates to `data/Endpoint#createOrganizationEndpoint`', function () {
      EndpointFactory.createOrganizationEndpoint('ORG_ID');

      expect(Endpoint.createOrganizationEndpoint).toHaveBeenCalledWith(
        'API_URL',
        'ORG_ID',
        expect.any(Object)
      );
    });
  });

  describe('#createSpaceEndpoint', () => {
    it('delegates to `data/Endpoint#createSpaceEndpoint`', function () {
      EndpointFactory.createSpaceEndpoint('SPACE_ID', 'ENV_ID');

      expect(Endpoint.createSpaceEndpoint).toHaveBeenCalledWith(
        'API_URL',
        'SPACE_ID',
        expect.any(Object),
        'ENV_ID'
      );
    });
  });
});
