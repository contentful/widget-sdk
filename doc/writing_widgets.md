# Writing widgets

The skeleton for writing a widget is:

```js
angular.module('contentful').run(['widgetTypes', function(widgetTypes){
  widgetTypes.registerWidget('widgetTypeId', {
    fieldTypes: ['Text', 'Symbol'], // Applicable field types
    name: 'Single Line',            // Displayed name
    template: '<input type="text" class="form-control" ng-disabled="!otEditable" ng-model="fieldData.value" ot-bind-text ot-subdoc>',
    options: [{
      param: '<PARAM KEY>'
      name: '<NAME DISPLAYED IN FORM>'
      default: '<DEFAULT VALUE>'
      type: ['Text', 'Number', 'Boolean', 'Predefined']
      values: [...] // if type is 'predefined' this contains the offered values
    }, ...]
  });
}};
```

## registerWidget(widgetTypeId, options)

The first parameter is the `widgetTypeId`. It is used to refer to the widget
internally and should never be changed. Else editing interfaces using
these widgets become invalid.

The second parameter is an options hash with the following keys:

| Key | Value|
| --- | -----|
| `name` | A human-readable name, displayed in the user interface
| `template` | The actual template for the widget. You can find more information on the structure of the template further down.
| `fieldTypes` | An array containing all field types this widget can be used on. Valid values are:
|| - Text|
|| - Symbol
|| - Integer
|| - Number
|| - Boolean
|| - Date
|| - Location
|| - Object
|| - Link (for a single link to an Asset or an Entry)
|| - Links (for an Array of links to an Asset or an Entry)
|| TODO: break these up into Entry/Entries Asset/Assets
|| - Symbols (for an Array of Symbols) 
| `options` | An array of option descriptors (see below). You can leave this one away entirely if there are no options to configure |

### Option descriptors

Widgets can be configured in the *EditingInterface* editor.
Every widget can have multiple parameters.
Every parameter has to be described in an option descriptor that looks like this:

```js
{
  param: '<PARAM KEY>'
  name: '<NAME DISPLAYED IN FORM>'
  default: '<DEFAULT VALUE>'
  type: ['Text', 'Number', 'Boolean', 'Predefined']
  values: [...] // if type is 'predefined' this contains the offered values
}
```

| Key | Value
| --
| `param` | The internal name of the parameter
| `name`  | The parameter name as displayed to the user
| `default` | The default value for the parameter
| `type`  | The type of the options
| `values` | If the type is `Predefined`, supply the available values in this array


## The template

The template is a piece of HTML that is rendered into the Entry Editor. Here you can use AngularJS to manipulate the model.
While you could theoretically write all your markup right in the template, you probably want to supply additional directives or services to the Angular module and make use of them here.

### APIs available to the widget template

There are several ways to edit an Entry field through a widget. We will display an example for each way along with explanations.
The one behavior they all share is that the data they manipulate is exposed on the scope as `fieldData.value`.

But since manipulation of entries has to be done through our realtime backend, changing `fieldData.value` is not sufficient. To also supply changes through the realtime backend use one of the following approaches.

#### Simplest method: otBindModel

Let's assume you wrote a simple color editor with the following template:
```html
<input type="text" ng-model="fieldData.value">
<div class="preview" style="background-color: #{{fieldData.value}}"></div>
```

On the scope, we expose a couple of methods and properties that allow you to manipulate the entry.
To simply update the realtime entry everytime you change `fieldData.value`, add the `otBindModel` directive to wherever you are using `ng-model`:

```html
<input type="text" ng-model="fieldData.value" ot-bind-model>
<div class="preview" style="background-color: #{{fieldData.value}}"></div>
```

That's it. Every change you make will be send through the realtime backend. Note however that every change will actually replace the old value, not edit it. That means that a text input box used in this fashion will not allow multiple users to edit text at the same time.

#### Editing Text

If you want collaborative text editing, use both the `ot-subdoc` and `ot-bind-text` directive on the input field:

```html
<input type="text" ng-model="fieldData.value" ot-subdoc ot-bind-text>
<div class="preview" style="background-color: #{{fieldData.value}}"></div>
```

Note that this of course only works with text inputs and textareas.

#### More complex editors

If you have a more complicated directive to edit your field, you might use multiple `ngModel`s inside your directive that assemble to form the final value. For example a date editor that has a subcomponent with a datepicker for the date part and an input field for the time part that are then combined into an ISO string that is assigned to `fieldData.value`

The template for you widget might look like this:
```html
<my-datetime-editor ng-model="fieldData.value"/>
```

With your directive template containing two subcomponents:
```html
<date-editor ng-model="internal.date" ng-change="updateIso()"/>
<time-editor ng-model="internal.time" ng-change="updateIso()"/>
```

And a link function like this:
```js
link: function(scope, element, attr) {
  scope.internal = {
    date: null,
    time: null,
    iso:  null
  };
  scope.updateIso = function(){
    scope.internal.iso = combine(internal.date, internal.time);
  }
  
  function combine(date, time){
    // return an ISO string from date and time  
  };
}
```

So, you have a value that is internal to your component (`internal`) and the external `fieldData.value`.
To wire the internal and the external value together, use the `otBindInternal` directive:

```html
<my-datetime-editor ng-model="fieldData.value" ot-bind-internal="internal.iso"/>
```

Then, whenever your internal value has changed and should update the model, call the `otBindInternalChangeHandler()` method on the scope. This method has two effects: It updates the changed value in the realtime backend, when that was successful, update the `fieldData.value` property accordingly. If the realtime backend rejects the operation, revert the internal value to the current content of `fieldData.value`

#### otBindModel or otBindInternal ?

Which one should you use? Your first choice should always be `otBindInternal`. It's workflow is cleaner and can handle errors better. To use it, you need to integrate it with your directive however, by calling the `otBindInternalChangeHandler` at the appropriate time. 

If you are using a 3rd party directive that uses `ngModel`, and you can' influence the internal behavior, it is easier to use `otBindModel` instead. The main difference between both is that `otBindInternal` waits for confirmation from the realtime backend before propagating the change to the entry, while `otBindModel` doesn't.

// TODO this is crap. otBindModel should just have the ability to revert mistakes and we wouldn't need otBindInternal

### Accessing the widget settings

If your widget has configurable settings, you can access the widget instance through the scope using `widget`.
The params are stored in an object under `widget.widgetParams`.

// TODO params that haven't been set are missing from there actually atm.
