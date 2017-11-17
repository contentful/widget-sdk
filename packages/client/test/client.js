/* jshint expr: true */
'use strict';

const {createRequestStub} = require('./support');

const Adapter = require('../lib/adapter');
const Client = require('../lib/client');
const describeSpaceFactory = require('./space_factory');
const describeSpaceInstance = require('./space_instance');

describe('client', function () {
  beforeEach(function () {
    this.request = createRequestStub();
    var adapter = new Adapter('', this.request.adapterRequest);
    this.client = new Client(adapter);
  });

  describe('space', function () {
    const serverSpaceData = Object.freeze({
      name: 'myspace',
      sys: {
        id: '42',
        type: 'Space',
        version: 0
      }
    });

    const serverSpaceList = Object.freeze({
      sys: { type: 'Array' },
      total: 123,
      items: [serverSpaceData]
    });

    describeSpaceFactory(serverSpaceData, serverSpaceList);
    describeSpaceInstance(serverSpaceData);
  });
});
