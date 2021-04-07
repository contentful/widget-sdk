import { createZipFromFiles, hasSameRootFolder } from './zipFiles';
import { FileWithPath } from './HostingDropzone';
import JSZip from 'jszip';

interface MockFile {
  name: string;
  body: string;
  mimeType: string;
  path: string;
}

const createFileFromMockFile = (file: MockFile): FileWithPath => {
  const mockedFile = new File([file.body], file.name, {
    type: file.mimeType,
    lastModified: new Date().getTime(),
  });
  mockedFile['lastModifiedDate'] = new Date();
  mockedFile['path'] = file.path;
  return mockedFile as FileWithPath;
};

describe('createZipFromFiles', () => {
  it('generate zip with correct type and size', async () => {
    const file = createFileFromMockFile({
      body: 'test',
      mimeType: 'text/html',
      name: 'test.txt',
      path: '/simple/index.html',
    });
    const zip = await createZipFromFiles([file as FileWithPath]);
    expect(zip.type).toBe('application/zip');
    expect(zip.size).toBe(118);
  });
  it('unzipped folder has correct folder structure', async () => {
    const fileInner = createFileFromMockFile({
      body: 'test',
      mimeType: 'text/html',
      name: 'index.html',
      path: '/simple/inner/index.html',
    });
    const fileNormal = createFileFromMockFile({
      body: 'test',
      mimeType: 'text/html',
      name: 'index.html',
      path: '/simple/folder/inner/index.html',
    });
    const zip = await createZipFromFiles([fileInner as FileWithPath, fileNormal as FileWithPath]);
    const jsZip = new JSZip();
    // more files !
    const zipFile = await jsZip.loadAsync(zip);
    // all elements are there (including folders and files)
    expect(Object.values(zipFile.files)).toHaveLength(5);
    // files are present and in the right place
    expect(zipFile.files['inner/index.html']).toBeTruthy();
    expect(zipFile.files['folder/inner/index.html']).toBeTruthy();
  });
});

describe('hasSameRootFolder', () => {
  it('should return true if root folder is always the same', () => {
    const files = [
      { path: '/root/inner/index.js' },
      { path: '/root/index.js' },
      { path: '/root/inner/path/index.js' },
    ];
    expect(hasSameRootFolder(files as FileWithPath[])).toBeTruthy();
  });
  it('should return false if root folder is not the same', () => {
    const files = [
      { path: '/another-folder/inner/index.js' },
      { path: '/root/index.js' },
      { path: '/root/inner/path/index.js' },
    ];
    expect(hasSameRootFolder(files as FileWithPath[])).toBeFalsy();
  });
});
