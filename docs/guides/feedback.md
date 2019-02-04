# Feedback

The feedback component and microservice can be used to collect user feedback via a form and send to a specified mail address.

## Adding or checking available target mail address

Check if `micro-backends/feedback/index.js` has the mail you want to send to in the`TARGET_MAILS` map.
Otherwise add it and note the key you used.

## Using the Component

You can find the component here: `app/common/FeedbackButton.es6.js`,
Required props are `target`, which is used as key for `TARGET_MAILS`, and `about`, which is a string that will be used in the text of the dialog.
Optional props:
 - type="button" // show button instead of link
 - label="Give feedback" // change label of feedback button
 
The mail will contain contact information for that user if he agreed to be contacted.
 
## Creating custom component

You can create your own component that dispatches the feedback action.
It's structure is:
```js
  dispatch({
    type: 'SEND_FEEDBACK',
    payload: { feedback, canBeContacted },
    meta: { about, target }
  })
```
You can also inspect the dispatched action when using the existing component with redux dev tools (e.g. the browser extension).
