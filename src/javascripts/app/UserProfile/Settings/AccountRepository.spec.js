import * as AccountRepository from './AccountRepository';
import { mockEndpoint } from 'data/EndpointFactory.es6';

describe('AccountRepository', () => {
  describe('fetchUserData', () => {
    it('should call the endpoint with GET and query', async () => {
      await AccountRepository.fetchUserData();

      expect(mockEndpoint).toHaveBeenCalledWith({
        method: 'GET',
        query: { profile: '' }
      })
    });
  });

  describe('updateUserData', () => {
    it('should call the endpoint with PUT, data, and version', async () => {
      await AccountRepository.updateUserData({
        version: 3,
        data: {
          firstName: 'John',
          lastName: 'Smith'
        }
      });

      expect(mockEndpoint).toHaveBeenCalledWith({
        method: 'PUT',
        data: {
          firstName: 'John',
          lastName: 'Smith'
        },
        version: 3
      })
    });
  });

  describe('deleteUserIdentityData', () => {
    it('should call the endpoint with DELETE with identity path and id', async () => {
      await AccountRepository.deleteUserIdentityData(5678);

      expect(mockEndpoint).toHaveBeenCalledWith({
        method: 'DELETE',
        path: ['identities', 5678]
      })
    });
  });

  describe('deleteUserAccount', () => {
    it('should call the endpoint with POST with user_cancellations path and data', async () => {
      await AccountRepository.deleteUserAccount({
        foo: 'bar'
      });

      expect(mockEndpoint).toHaveBeenCalledWith({
        method: 'POST',
        path: ['user_cancellations'],
        data: {
          foo: 'bar'
        }
      })
    });
  });
});
