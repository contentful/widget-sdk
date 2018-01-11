const co = require('co');
const sinon = require('sinon');
const _ = require('lodash');

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));

module.exports = {
  coit: coit,
  createRequestStub: createRequestStub,
  clone: _.cloneDeep.bind(_),
  expect: chai.expect
};


function coit (name, generator) {
  if (generator) { it(name, co.wrap(generator)); } else { it(name); }
}

coit.only = function coitOnly (name, generator) {
  it.only(name, co.wrap(generator));
};


function createRequestStub () {
  var request = sinon.spy(function ({payload}) {
    if (!request.responses.length) { throw new Error('No server responses provided'); }
    var {data, error, mirror} = request.responses.shift();
    if (error) { return Promise.reject(error); } else if (mirror) { return Promise.resolve(_.cloneDeep(payload)); } else { return Promise.resolve(_.cloneDeep(data)); }
  });

  request.respond = function (response) {
    if (typeof response === 'undefined') { this.responses.push({mirror: true}); } else { this.responses.push({data: _.cloneDeep(response)}); }
  };

  request.throw = function (error) {
    this.responses.push({error: error});
  };

  request.reset = function () {
    this.responses = [];
    sinon.spy.reset.call(this);
  };

  /**
   * Simplifies request parameters to facilitate asserting call
   * arguments.
   */
  request.adapterRequest = function (r) {
    if (_.isEmpty(r.headers)) { delete r.headers; }
    if (!r.params) { delete r.params; }
    if (!r.data) { delete r.data; }
    return request(r);
  };

  request.reset();
  return request;
}
