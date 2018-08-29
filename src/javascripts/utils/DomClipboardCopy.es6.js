/**
 * Given a string value this function copies it to the user’s clipboard
 */
export default function(value) {
  // we use text area instead of a text input since we
  // want to able to copy multiline snippets as well
  const textArea = document.createElement('textarea');
  textArea.value = value;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy', false);
  document.body.removeChild(textArea);
}
