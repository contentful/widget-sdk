export function downloadBlob(blob, filename) {
  // https://blog.logrocket.com/programmatic-file-downloads-in-the-browser-9a5186298d5c/
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = filename;

  // Without the setTimeout, the URL is revoked before the browser can download it
  const clickHandler = () => {
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.removeEventListener('click', clickHandler);
    });
  };

  a.addEventListener('click', clickHandler, false);
  a.click();
}
