angular.module('contentful/services').service 'widgets', ($compile) ->
  'use strict'

  editWidgets =
    string:
      textField:
        name: "Single line text field"
        template: """<input type="text" ng-model="value" ot-bind="text" ng-disabled="!editable"/>"""
    text:
      textArea:
        name: "Multiline text field"
        template: """<textarea class="input-xxlarge" ng-model="value" ot-bind="text" ng-disabled="!editable"></textarea>"""
    boolean:
      checkBox:
        name: "Boolean Checkbox"
        template: """
          <label><input type="radio" ng-model="value" ng-value="true" ot-bind="model" ng-disabled="!editable"/><span class="yes">Yes</span></label>
          <label><input type="radio" ng-model="value" ng-value="false" ot-bind="model" ng-disabled="!editable"/><span class="no" >No</span ></label>
        """
    date:
      textField:
        name: "Date Field"
        template: """<div class="cf-datetime-editor"/>"""
    array:
      default:
        name: "Default"
        template: ''
        link: (scope, elm, attr) ->
          itemType = scope.field.items?.type
          if itemType == 'link'
            template = $ """<div cf-autocomplete="entries"/>"""
          else if itemType == 'string'
            template = $ """<input type="text" ng-list="" ng-model="value" ot-bind="model" ng-disabled="!editable"/>"""
          template = $compile(template)(scope)
          elm.append template
    object:
      jsonArea:
        name: "JSON Field"
        template: """<textarea class="input-xxlarge" ng-model="value" ot-bind="model" ng-disabled="!editable"></textarea>"""
        link: (scope, elm, attr) ->
          controller = elm.find('textarea').inheritedData('$ngModelController')
          controller.$formatters.push (obj) -> JSON.stringify(obj)
          controller.$parsers.push (string) ->
            try
              json = JSON.parse(string)
              controller.$setValidity('json', true)
              return json
            catch e
              controller.$setValidity('json', false)
              return undefined
    location:
      googlemap:
        name: "Location Picker"
        template: """<div class="cf-location-editor"></div>"""

    number:
      textField:
        name: "Textfield for floats"
        template: """<input type="number" ng-model="value" ot-bind="model" ng-disabled="!editable"/>"""
        link: (scope, elm, attr) ->
          controller = elm.find('input').inheritedData('$ngModelController')
          controller.$parsers.unshift (viewValue) ->
            FLOAT_REGEXP = /^\-?\d+((\.|\,)\d+)?$/
            if FLOAT_REGEXP.test(viewValue)
              controller.$setValidity('float', true)
              return parseFloat(viewValue.replace(',', '.'))
            else
              controller.$setValidity('float', false)
              return undefined
    integer:
      textField:
        name: "Textfield for integers"
        template: """<input type="number" ng-pattern="/^\\-?\\d*$/" ng-model="value" ot-bind="model" ng-disabled="!editable"/>"""
    link:
      selector:
        name: "Link selector"
        template: """<div cf-autocomplete="entry"/>"""
    
  displayWidgets =
    string:
      textField:
        template: "{{entry[fieldName]}}"

  class WidgetBuilder
    editor:  (fieldType, widgetType) ->
      type = editWidgets[fieldType] ? editWidgets.string
      type[widgetType] ? _.values(type)[0]
    display: (fieldType, widgetType) ->
      type = editWidgets[fieldType] ? editWidgets.string
      type[widgetType] ? _.values(type)[0]
    availableEditWidgets: (fieldType) ->
      _.keys(editWidgets[fieldType])
    availableDisplayWidgets: (fieldType) ->
      _.keys(displayWidgets[fieldType])
          
  return new WidgetBuilder
