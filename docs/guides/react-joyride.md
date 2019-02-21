# Use ReactJoyride

[ReactJoyride](https://github.com/gilbarbara/react-joyride)
ReactJoyride is a react component for guided ui tours. It contains wide range of functionality for UI tour. There are some tips on how to use it.

## Custom tooltips and beacons

ReactJoyride accepts [custom](https://docs.react-joyride.com/custom-components) tooltips and beacons as props.

## ReactJoyride callback

ReactJoyride accepts `callback` function as a prop. This function is called every time ReactJoyride state is changed. It will be called with current state properties. Like `action` and `index`.

```js
action: action_name
controlled: boolean
index: step_index
lifecycle: lifecycle_stage
size: step_count
status: current_tour_status
step: step_props
type: ? // no clear documentation on that
```

You can see example on how it can be used for changing default behaviour in this file: /src/javascripts/app/home/widgets/walkthrough/WalkthroughComponent.es6.js:28

## ReactJoyride getHelpers

ReactJoyride accepts in props function to set helpers for controlling it's state. You can see example on how to use it in `WalkthroughComponent`. `this.helpers.reset(true);` was used to owerride default ReactJoyride behaviour. Instead of "pausing" on close and resuming from the step user closed, we reset the whole state so next time user starts the tour, it starts from the first step.
Some other helpers: `prev, next, go, close, skip, reset, info`.

## ReactJoyride styles

ReactJoyride accepts `styles` as prop. The style properties user of the library can change are pretty limited. More information on styling [here](https://docs.react-joyride.com/styling).
For more "custom" appearance you need to use custom tooltips and beacons.

## ReactJoyride steps

`steps` is a pop that defines tour steps. It's an array of objects with deferent properties you can use to control the tour. You can see more information on steps [here](https://docs.react-joyride.com/step).
Note: it's probably better to use some kind of `data-tour-step-id` to prevent tour from accidental breakage. If the step's target element will be accidentally removed after all, the ReactJoyride will handle it gracefully: it logs an error and shows the next step with target still on the page.
