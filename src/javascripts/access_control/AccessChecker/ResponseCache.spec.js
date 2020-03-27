import * as _ from 'lodash';
import * as cache from 'access_control/AccessChecker/ResponseCache';

const noNewEnforcements = {};

function callTwice(action, entity) {
  cache.getResponse(action, entity, noNewEnforcements);
  cache.getResponse(action, entity, noNewEnforcements);
}

describe('Response Cache', () => {
  const entry = { sys: { id: 'eid', type: 'Entry' } };
  const asset = { sys: { id: 'aid', type: 'Asset' } };
  const newEnforcementsAvailable = {
    reasonsDenied: () => ['reason'],
    deniedEntities: ['Entry'],
  };

  let canMock;

  beforeEach(() => {
    canMock = jest.fn(() => true);
    cache.reset({ can: canMock });
  });

  it('Returns false when the new enforcements exist', () => {
    const result = cache.getResponse('create', 'Entry', newEnforcementsAvailable);
    expect(result).toEqual(false);
  });

  it('Calls "can" when getting response for the first time', () => {
    cache.getResponse('create', 'Entry', noNewEnforcements);
    expect(canMock).toHaveBeenCalledTimes(1);
  });

  it('Multiple calls are cached', () => {
    callTwice('create', 'Entry');
    expect(canMock).toHaveBeenCalledTimes(1);
    expect(canMock).toHaveBeenCalledWith('create', 'Entry');
  });

  it('Caches general permission checks', () => {
    callTwice('create', 'Asset');
    callTwice('read', 'Entry');
    callTwice('publish', 'Entry');
    expect(canMock).toHaveBeenCalledTimes(3);
    expect(canMock).toHaveBeenNthCalledWith(1, 'create', 'Asset');
    expect(canMock).toHaveBeenNthCalledWith(2, 'read', 'Entry');
    expect(canMock).toHaveBeenNthCalledWith(3, 'publish', 'Entry');
  });

  it('Caches Entry permission checks', () => {
    callTwice('create', entry);
    callTwice('delete', entry);
    callTwice('update', entry);
    expect(canMock).toHaveBeenCalledTimes(3);
    expect(canMock).toHaveBeenNthCalledWith(1, 'create', entry);
    expect(canMock).toHaveBeenNthCalledWith(2, 'delete', entry);
    expect(canMock).toHaveBeenNthCalledWith(3, 'update', entry);
  });

  it('Caches separate permission checks for two different Entries', () => {
    const entry2 = _.cloneDeep(entry);
    entry2.sys.id = 'eid2';

    callTwice('read', entry);
    callTwice('read', entry2);

    expect(canMock).toHaveBeenCalledTimes(2);
    expect(canMock).toHaveBeenNthCalledWith(1, 'read', entry);
    expect(canMock).toHaveBeenNthCalledWith(2, 'read', entry2);
  });

  it('Caches separate permission checks for two different general entities', () => {
    callTwice('read', 'Entry');
    callTwice('read', 'Settings');

    expect(canMock).toHaveBeenCalledTimes(2);
    expect(canMock).toHaveBeenNthCalledWith(1, 'read', 'Entry');
    expect(canMock).toHaveBeenNthCalledWith(2, 'read', 'Settings');
  });

  it('Caches Asset permission checks', () => {
    callTwice('read', asset);
    callTwice('delete', asset);
    callTwice('update', asset);
    expect(canMock).toHaveBeenCalledTimes(3);
    expect(canMock).toHaveBeenNthCalledWith(1, 'read', asset);
    expect(canMock).toHaveBeenNthCalledWith(2, 'delete', asset);
    expect(canMock).toHaveBeenNthCalledWith(3, 'update', asset);
  });

  it('Caches separate permission checks for two different Assets', () => {
    const asset2 = _.cloneDeep(asset);
    asset2.sys.id = 'aid2';
    callTwice('update', asset);
    callTwice('update', asset2);

    expect(canMock).toHaveBeenCalledTimes(2);
    expect(canMock).toHaveBeenCalledWith('update', asset);
    expect(canMock).toHaveBeenCalledWith('update', asset2);
  });

  it('Does not cache when type is not given', () => {
    callTwice('read');
    callTwice('read', { sys: {} });
    expect(canMock).toHaveBeenCalledTimes(4);
  });

  it('Does not cache when "can" does not return boolean', () => {
    canMock = jest.fn(() => null);
    cache.reset({ can: canMock });

    callTwice('read', 'Entry');
    expect(canMock).toHaveBeenCalledTimes(2);
  });
});
