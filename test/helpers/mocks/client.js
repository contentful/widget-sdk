import * as sinon from 'helpers/sinon';

angular.module('contentful/mocks')

/**
 * @ngdoc service
 * @name contentTypeMock
 * @module contentful/mocks
 */
.factory('contentTypeMock', ['mockClient', function (client) {
  let id = 0;

  return {
    create: create
  };

  /**
   * @ngdoc method
   * @name contentTypeMock#create
   * @description
   * Create a `ContentType` object from the client library.
   *
   * Any method calls that talk to an API endpoint will return a
   * rejected promise.
   *
   * @param {ContentType.Field[]} fields
   * @return {ContentType}
   */
  function create (fields) {
    return new client.ContentType({
      sys: { id: ++id },
      fields: fields
    }, client.mockPersistenceContext());
  }
}])

.factory('mockClient', ['$q', 'libs/@contentful/client', function ($q, client) {
  return _.extend({
    mockPersistenceContext: mockPersistenceContext
  }, client);

  function mockPersistenceContext () {
    const request = new client.Request({
      request: sinon.stub().returns($q.reject(new Error('Requests are mocked')))
    });
    return new client.PersistenceContext(request);
  }
}]);
