angular.module('contentful').service 'widgets', ($compile) ->
  'use strict'

  editWidgets =
    String:
      textField:
        name: "Single line text field"
        template: """<input type="text" ot-subdoc ot-bind-text ng-disabled="otDisabled"/>"""
    Text:
      textArea:
        name: "Multiline text field"
        template: """<textarea class="input-autogrow input-xxlarge" ot-subdoc ot-bind-text ng-disabled="otDisabled"></textarea>"""
    Boolean:
      checkBox:
        name: "Boolean Checkbox"
        template: """
          <label><input type="radio" ng-model="value" ng-value="true" ot-bind-model ng-disabled="otDisabled"/><span class="yes">Yes</span></label>
          <label><input type="radio" ng-model="value" ng-value="false" ot-bind-model ng-disabled="otDisabled"/><span class="no" >No</span ></label>
        """
    Date:
      textField:
        name: "Date Field"
        template: """<div class="cf-datetime-editor"/>"""
    Array:
      default:
        name: "Default"
        template: ''
        link: (scope, elm, attr) ->
          itemType = scope.field.items?.type
          if itemType == 'Link'
            template = $ """<div cf-autocomplete="entries"/>"""
          else if itemType == 'String'
            template = $ """<input type="text" ng-list="" ng-model="value" ot-bind-model ng-disabled="otDisabled"/>"""
          template.appendTo(elm)
          $compile(template)(scope)
    Object:
      jsonArea:
        name: "JSON Field"
        template: """<textarea class="input-xxlarge" ng-model="value" ot-bind-model ng-disabled="otDisabled"></textarea>"""
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
    Location:
      googlemap:
        name: "Location Picker"
        template: """<div class="cf-location-editor"></div>"""

    Number:
      textField:
        name: "Textfield for floats"
        template: """<input type="number" ng-model="value" ot-bind-model ng-disabled="otDisabled"/>"""
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
    Integer:
      textField:
        name: "Textfield for integers"
        template: """<input type="number" ng-pattern="/^\\-?\\d*$/" ng-model="value" ot-bind-model ng-disabled="otDisabled"/>"""
    Link:
      selector:
        name: "Link selector"
        template: """<div cf-autocomplete="entry"/>"""
    
  displayWidgets =
    String:
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
