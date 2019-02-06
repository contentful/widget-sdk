# Typeform embeds in the web app

This directory contains two components that can be used to embed a Typeform based form natively in the webapp.

## Motivation

These components spawned out of the need to gather directed feedback in #team-discovery-lab for our
concepts video that is shown to the Authors and Editors in the role aware space home.

We started off by embedding a Typeform directly into the `wistia` video player as they supported it.
Or so we thought. This approach led to random crashes in the video, certain interactions failing and
random errors being logged to the console (and hence bugsnag).

We then tried using the existing [FeedbackDialog](/src/javascripts/app/common/FeedbackDialog.es6.js) component.
While this is well made, it wasn't flexible and hence didn't meet our requirements.

Therefore, we opted to embed Typeform based forms directly into the web app and the components you
see in this folder are the result.

## Components

### TypeformModal

This component embeds the Typeform given by the `typeformUrl` into a Forma36 `Modal` as a
[widget](https://developer.typeform.com/embed/modes/#widget-mode). The behaviour of the `Modal`
is whatever is defined by Forma36 and untouched by this component. This component only augments the
behaviour by exposing some `TypeformEmbed` props at the top level.

#### Example

```jsx
import React from 'react';
import { TypeformModal } from 'app/common/Typeform/TypeformModal.es6'

export function MyAwesomeCounter() {
  const [count, setCount] = useState(0)
  const [feedbackModalIsOpen, setFeedbackModalIsOpen] = useState(false)
  const [thanks, showThanks] = useState(false)

  const closeFeedbackModalAndThank = () = {
    setFeedbackModalIsOpen(false)
    showThanks(true)
  }

  if (count === 5) {
    setFeedbackModalIsOpen(true)
  }

  if (count > 5) {
    showThanks(false)
  }

  return (
    <React.Fragment>
      { thanks ? <h3>Thanks for your feedback!</h3> : null }
      <div>
        <p>Count is {count}<p>
        <button onClick={_ => setCount(++count)}>Increment counter</button>
      </div>
      <TypeformModal
        title="Share your feedback about this amazing counter"
        isShown={feedbackModalIsOpen}
        onClose={_ => setFeedbackModalIsOpen(false)}
        testId="counter-feedback-modal"
        typeformUrl="https://contentful.typeform.com/to/myAwesomeCounterForm"
        onTypeformSubmit={closeFeedbackModalAndThank}
      />
    </React.Fragment>
  )
}
```

#### props

```ts
title: string
isShown: boolean
onClose: (...args) => unknown
typeformUrl: string
onTypeformSubmit?: (...args) => unknown
testId?: string
```

#### default props

```js
onTypeformSubmit: () => this.props.onClose()
testId: 'cf-ui-typeform-modal'
```

#### default props passed to Forma36 Modal

```js
allowHeightOverflow: true
size: '700px'
```

#### default props passed to TypeformEmbed

```js
renderAs: 'widget'
widgetOpacity: 0
className: 'cf-typeform-modal'
```

### TypeformEmbed

This is a lower level component that uses the [Typeform embed api](https://developer.typeform.com/embed/)
to embed the form either as a [widget](https://developer.typeform.com/embed/modes/#widget-mode) or as a
fullscreen [popup](https://developer.typeform.com/embed/modes/#popup-mode).

You'll most likely never interact with this and will use the `TypeformModal` component instead.

#### Example

```js
import React from 'react';
import { TypeformEmbed } from 'app/common/Typeform/TypeformEmbed.es6';

export class TriggerTypeformPopup extends React.Component {
  typeform
  openForm = () => this.typeform.open()
  onFormSubmit = () => setTimeout(() => this.typeform.close(), 2000)

  render() {
    return (
      <React.Fragment>
        <button onClick={this.openForm}>Provide feedback</button>
        <TypeformEmbed
          url="https://url.to.my.typeform"
          renderAs="popup"
          popupMode="drawer_left"
          onSubmit={this.onFormSubmit}
          ref={tf => this.typeform = tf.typeformPopup}
        />
      </React.Fragment>
    )
  }
}
```

#### props

```ts
url: string
renderAs: 'popup' | 'widget'

// common options
hideHeaders?: boolean
hideFooter?: boolean
onSubmit?: (...args) => unknown

// styling
className?: string

// widget mode options
widgetOpacity?: number
widgetStartButtonText?: string

// popup mode options
popupMode?: 'popup' | 'drawer_left' | 'drawer_right',
popupAutoOpen?: boolean
// Auto close popup after submission
// if not on Pro+ plan, anywhere between 1s - 5s
// otherwise whatever you configure in your Typeform form settings
popupAutoCloseDuration?: number
```

#### default props

```js
hideHeaders: true
hideFooter: true
onSubmit: () => {}

// widget defaults
widgetOpacity: 100
widgetStartButtonText: 'Start'

// styling
className: ''

// popup defaults
popupMode: 'popup'
popupAutoOpen: false
popupAutoCloseDuration: 5000 // this is the default for non-PRO+ accounts
```
