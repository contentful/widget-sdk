import JSZip from 'jszip';
import { FileWithPath } from './HostingDropzone';

export const hasSameRootFolder = (files: FileWithPath[]) => {
  const splitFilePaths = files.map((file) => {
    let pathElements = file.path.split('/');
    // remove empty elements
    pathElements = pathElements.filter((folder) => folder.length > 0);
    // return root element
    return pathElements[0];
  });
  return new Set(splitFilePaths).size === 1;
};

export async function createZipFromFiles(files: FileWithPath[]) {
  const zip = new JSZip();

  const isOneFile = hasSameRootFolder(files);

  files.forEach((file) => {
    // Identify folders by path
    const folders = file.path.split('/').filter((folder) => folder.length > 0);
    if (isOneFile) {
      // remove root folder
      folders.splice(0, 1);
    }
    // add file to zip instance
    zipFileFromPath(zip, file, folders);
  });
  return await zip.generateAsync({ type: 'blob' });
}

function zipFileFromPath(zip: JSZip, file: File, folders: string[]) {
  // if file -> add file element to zip
  if (folders.length <= 1) {
    zip.file(file.name, file);
    return;
  }
  // if element is folder -> create new folder and recursively continue
  zip = zip.folder(folders[0]) || zip;
  folders.splice(0, 1);
  zipFileFromPath(zip, file, folders);
}
