import { fileContainsAbsolutePath, getEntryFile, validateBundle } from './bundleValidation';
import { UI_BUNDLE_ERRORS, UI_BUNDLE_WARNINGS } from './constants';

const fileWithAbsolutePath = new File(['<script src="/absolute/path"></script>'], 'filename', {
  type: 'text/html',
});

const fileWithRelativePath = new File(['<script src="./relative/path"></script>'], 'filename', {
  type: 'text/html',
});

const fileWithRelativeAndAbsolutePath = new File(
  ['<html><script src="./absolute/path"></script><script src="/relative/path"></script></html>'],
  'filename',
  {
    type: 'text/html',
  }
);

const fileWithNoLink = new File(['empty'], 'index.html', {
  type: 'text/html',
});

const entryFile = new File(['<script src="./relative/path"></script>'], 'index.html', {
  type: 'text/html',
});
const entryFileWithAbsolutePath = new File(
  ['<script src="/absolute/path"></script>'],
  'index.html',
  {
    type: 'text/html',
  }
);

const zipFile = new File(['this doesnt matter'], 'test.zip', {
  type: 'application/zip',
});

describe('bundleValidation', () => {
  describe('fileContainsAbsolutePath', () => {
    it('returns false for file without relative path', async () => {
      const itContainsAbsolutePath = await fileContainsAbsolutePath(fileWithRelativePath);
      expect(itContainsAbsolutePath).toBeFalsy();
    });
    it('returns true for file with absolute path', async () => {
      const itContainsAbsolutePath = await fileContainsAbsolutePath(fileWithAbsolutePath);
      expect(itContainsAbsolutePath).toBeTruthy();
    });
    it('returns false for file with no path', async () => {
      const itContainsAbsolutePath = await fileContainsAbsolutePath(fileWithNoLink);
      expect(itContainsAbsolutePath).toBeFalsy();
    });
    it('return true for file with absolute and relative path', async () => {
      const itContainsAbsolutePath = await fileContainsAbsolutePath(
        fileWithRelativeAndAbsolutePath
      );
      expect(itContainsAbsolutePath).toBeTruthy();
    });
  });
  describe('getEntryFile', () => {
    it('finds the correct entry file', () => {
      const foundEntryFile = getEntryFile([fileWithAbsolutePath, fileWithRelativePath, entryFile]);
      expect(foundEntryFile).toBe(entryFile);
    });
    it('returns undefined when no entry file', () => {
      const foundEntryFile = getEntryFile([fileWithAbsolutePath, fileWithRelativePath]);
      expect(foundEntryFile).toBeFalsy();
    });
  });
  describe('validateBundle', () => {
    it('returns empty error when no files included', async () => {
      const errorMessage = await validateBundle([]);
      expect(errorMessage?.type).toBe('error');
      expect(errorMessage?.message).toBe(UI_BUNDLE_ERRORS.EMPTY);
    });
    it('returns no entry file error when no entry file included', async () => {
      const errorMessage = await validateBundle([fileWithAbsolutePath, fileWithRelativePath]);
      expect(errorMessage?.type).toBe('error');
      expect(errorMessage?.message).toBe(UI_BUNDLE_ERRORS.ENTRY_FILE);
    });
    it('returns validation warning when there are absolute paths', async () => {
      const errorMessage = await validateBundle([entryFileWithAbsolutePath]);
      expect(errorMessage?.type).toBe('warning');
      expect(errorMessage?.message).toBe(UI_BUNDLE_WARNINGS.ABSOLUTE_PATH);
    });
    it('returns null when one zip file', async () => {
      const errorMessage = await validateBundle([zipFile]);
      expect(errorMessage).toBeNull();
    });
    it('returns null when passed correct bundle', async () => {
      const errorMessage = await validateBundle([entryFile, fileWithRelativePath]);
      expect(errorMessage).toBeNull();
    });
  });
});
