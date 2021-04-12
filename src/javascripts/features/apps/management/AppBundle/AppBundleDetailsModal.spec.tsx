import { parseFileSize, splitFileAndPath } from './AppBundleDetailsModal';

describe('Parsing file sizes', () => {
  it('converts to Mb before Kb', () => {
    const readableSize = parseFileSize(1234567);
    expect(readableSize).toEqual('1.23 MB');
  });

  it('converts to Kb before bytes', () => {
    const readableSize = parseFileSize(1234);
    expect(readableSize).toEqual('1.23 KB');
  });

  it('always falls back to bytes', () => {
    const readableSize = parseFileSize(123);
    expect(readableSize).toEqual('123 B');
  });
});

describe('Splitting file name from path', () => {
  it('path is empty when file is at top level', () => {
    const splut = splitFileAndPath('index.html');
    expect(splut).toEqual({ path: '', name: 'index.html' });
  });

  it('splits filename and path correctly', () => {
    const splut = splitFileAndPath('test/index.html');
    expect(splut).toEqual({ path: 'test/', name: 'index.html' });
  });

  it('splits filename and path correctly several levels deep', () => {
    const splut = splitFileAndPath('test/folder/inanotherfolder/andfinallyfile.map.js');
    expect(splut).toEqual({ path: 'test/folder/inanotherfolder/', name: 'andfinallyfile.map.js' });
  });
});
