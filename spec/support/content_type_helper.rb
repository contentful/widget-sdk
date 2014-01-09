module ContentTypeHelper
  def add_field(name, type, options={})
    find('.add-field-button, button', text: 'Field').click
    find(".type[data-type-name='#{type}']").click

    find_field 'fieldName'
    sleep 0.3
    fill_in 'fieldName', with: name
    fill_in 'fieldId'  , with: options[:id] if options[:id]
    find('.toggle-localized').click if options[:localized]
    find('.toggle-required').click if options[:required]
  end

  def for_field(field_name)
    field_settings = find :xpath, %Q{//*[contains(@class, 'display')]/*[contains(@class, 'name')][text()='#{field_name}']/../..}
    field_settings.click() unless field_settings[:class] !~ /open/

    within(field_settings) do
      yield
    end
  end

  def toggle_disable(on_off)
    find '.toggle-disabled'
    begin
      if on_off == true
        find('.toggle-disabled:not(.active)').click
      elsif on_of == false
        find('.toggle-disabled.active').click
      else
        find('.toggle-disabled').click
      end
    rescue Capybara::ElementNotFound
    end
  end

  def in_validations
    find('.toggle-validate').click
    unscope do
      find('.validation-dialog')
      within('.validation-dialog .modal-dialog') do
        yield
        find('.close-button').click
      end
    end
  end

  def add_validation(name)
    find('.dropdown-toggle', text:'Validation').click
    find('.dropdown-menu li', text: name).click
    
    expect(page).to have_selector('.cf-validation-options', minimum: 1)
    validation = all('.cf-validation-options').last
    within validation do
      yield if block_given?
    end
  end

  def create_content_type(field_type, *fields)
    add_button 'Content Type'
    if fields.blank?
      fill_in 'contentTypeName', with: "Entry with #{field_type}"
      add_field "#{field_type} Field", field_type
    else
      fill_in 'contentTypeName', with: field_type
      fields.each do |field|
        add_field "#{field} Field", field
      end
    end
    yield if block_given?
    wait_for_sharejs
    find('button.publish').click
    expect_success 'successfully'
    close_tab
  end
end
