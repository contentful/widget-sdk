module EditorHelper
  def edit_field(id, locale = 'en-US', extra_selector = '')
    selector = %Q{[data-field-id="#{id}"] [data-locale="#{locale}"] #{extra_selector}} 
    if block_given?
      within(selector){ yield }
    else
      find selector
    end
  end
end
