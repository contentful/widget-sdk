# TOC
  1. [Glossary](#glossary)
  2. [What's a Widget](#whats-a-widget)
  3. [Setup a Widget](#setup-a-widget)
  4. [Writing Widgets](#writing-widgets)
    1. [registerWidget(...)](#registerwidgetwidgettypeid-options)
      1. [Widget Descriptor: fieldTypes](#widget-descriptor-fieldtypes)
      2. [Widget Descriptor: options](#widget-descriptor-options)
      2. [Widget Descriptor: template](#widget-descriptor-template)

# Glossary

  * Content Type Editor: View where the users can edit a Content Type. This editor allows: fields renaming, fields reordering, fields deletion, etc.
  * Entry Editor: A form that allows the user to input and modify the data in an entry.
  * Editing Interface: A named collection of Widgets that belongs to a Content Type. The Editing Interface determines how the Entry Editor for an Entry with that Content Type is generated (available fields, which form elements are used to edit a field etc.) 
  * Editing Interface Editor: A View where the users can modify an Editing Interface and change or configure the widget applied to every field in the Content Type.
  * Widget Descriptor: Hash that describes a widget. Is used by the application to generate and show the widgets in the UI.
  * Option Descriptor: A widget can have 0 or more parameters. To generate the options for configuring these parameters in the EditingInterface Editor, every widget contains an option descriptor for every parameter.

# What's a Widget

A widget is a visual component that is used by the Entry Editor to allow a user to change the value of a field in the Entry.
For every field type, there is a default widget that is supplied by the user interface. Through the EditingInterface Editor, the user can change which widget is used for each field of a Content Type.

# Setup a Widget

From the *Content Type Editor* the user can go to the *Editing Interface Editor* for that Content Type by clicking the "Customize View" button. In the Editing Interface Editor the user can: 
  * Change the widget applied to each field in the Content Type.
  * Customize the behaviour of those widgets that allow to do so by changing their parameters.

# Writing Widgets

Since the Contentful user interface is written in [AngularJS](http://angularjs.org), the widget system relies on some of AngularJS mechanics. Familiarity with AngularJS is a requirement for developing widgets.

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

## registerWidget(widgetTypeId, widgetDescriptor)

The first parameter is the `widgetTypeId`. It is used to refer to the widget internally and should never be changed. Else all Editing Interfaces that include this widget become invalid.

The second parameter is a *Widget Descriptor* with the following keys:


| Required | Key | Value|
| -------- |--- | -----|
| true | `name` | A human-readable name, displayed in the user interface
| true | `template` | The actual template for the widget. You can find more information on the structure of the template further down.
| true | `fieldTypes` | An array containing all field types this widget can be used on. See below for a list of valid types.
| false | `options` | An array of *Option descriptors* (see below). You can leave this one away entirely if there are no options to configure. |

### Widget Descriptor: fieldTypes

The `fieldTypes` property is an Array which specifies all the field types this widget can be used on. Valid values are:

  * Text
  * Symbol
  * Integer
  * Number
  * Boolean
  * Date
  * Location
  * Object
  * Asset/Entry (for a single link to an Asset or an Entry)
  * Assets/Entries (for an Array on links to Assets or Entries)
  * Symbols

On the *Editing Interface Editor* the user can choose a widget for a field among all the widgets that can be applied to the fields type. When there is no specific widget selected for a field, one of the internal widgets is used.

### Widget Descriptor: options

Every widget can have multiple options in the *Editing Interface Editor*, that are used to change its parameters and configure its appearance or behavior. The options for a widget are specified using the **options** property in the *Widget Descriptor* hash. Every option has to be described in an *Option Descriptor* that looks like this:

```js
{
  param: '<PARAM KEY>'
  name: '<NAME DISPLAYED IN FORM>'
  default: '<DEFAULT VALUE>'
  type: // One of 'Text', 'Number', 'Boolean' or 'Predefined'
  values: // if type is 'predefined' this contains the offered values
}
```

| Required | Key | Value
| -------- | --- | -----
| true | `param` | The internal name of the parameter
| true | `name`  | The parameter name as displayed to the user
| false| `default` | The default value for the parameter
| true | `type`  | The type of the options. Can be one of 'Text', 'Number', 'Boolean' or 'Predefined'
| false| `values` | If the type is `Predefined`, supply the available values in this array

There is a default *Option Descriptor* that is applied to all widgets. This parameter allows the user to create/modifiy a help text for the widget. Its *Option Descriptor* looks like this:

```js
{
    param: 'helpText',
    name: 'Help text',
    type: 'Text',
    description: 'This help text will show up below the field'
}

```

### Widget Descriptor: template

The template is a piece of HTML that is rendered into the *Entry Edition Interface*. Here you can use AngularJS to manipulate the model.
While you could theoretically write all your markup right in the template, you probably want to supply additional directives or services to the Angular module and make use of them here.

#### APIs available to the widget template

There are several ways to edit an Entry field through a widget. We will display an example for each way along with explanations.
The one behavior they all share is that the data they manipulate is exposed on the scope as `fieldData.value`.

But since manipulation of entries has to be done through our realtime backend, changing `fieldData.value` is not sufficient. To also supply changes through the realtime backend use one of the following approaches.

##### Simplest method: otBindModel

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

That's it. Every change you make will be send through the realtime backend. Note that every change will actually replace the old value, not edit it. That means that a text input box used in this fashion will not allow multiple users to edit text at the same time.

##### Editing Text: otSubDoc and otBindText

If you want collaborative text editing, use both the `ot-subdoc` and `ot-bind-text` directive on the input field:

```html
<input type="text" ng-model="fieldData.value" ot-subdoc ot-bind-text>
<div class="preview" style="background-color: #{{fieldData.value}}"></div>
```

Note that this only works with text inputs and textareas.

##### More complex editors: otBindInternal

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
    scope.internal.iso = combine(scope.internal.date, scope.internal.time);
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

Then, whenever your internal value has changed and should update the model, call the `otBindInternalChangeHandler()` method on the scope. This method has two effects: It updates the changed value in the realtime backend, when that was successful, update the `fieldData.value` property accordingly. If the realtime backend rejects the operation, revert the internal value to the current content of `fieldData.value`. Continuing with the example, the `updateIso` function will look like this with the `otBindInternalChangeHandler()` included:

```js
scope.updateIso(date, time){k
  scope.internal.iso = combine(scope.internal.date, scope.internal.time);
  otBindInternalChangeHandler(); //save the changes in the backend
}
```

#### otBindModel or otBindInternal ?

Which one should you use? Your first choice should always be `otBindInternal`. It's workflow is cleaner and can handle errors better. To use it, you need to integrate it with your directive, by calling the `otBindInternalChangeHandler` at the appropriate time.

If you are using a 3rd party directive that uses `ngModel`, and you can' influence the internal behavior, it is easier to use `otBindModel` instead. The main difference between both is that `otBindInternal` waits for confirmation from the realtime backend before propagating the change to the entry, while `otBindModel` doesn't.

// TODO this is crap. otBindModel should just have the ability to revert mistakes and we wouldn't need otBindInternal

### Accessing the widget settings

If your widget has configurable settings, you can access the widget instance through the scope using `widget`.
The params are stored in an object under `widget.widgetParams`.
