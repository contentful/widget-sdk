require 'spec_helper'

feature 'Reload Notification', js: true, sauce: true do
  before do
    ensure_login
  end

  scenario 'Causing an error' do
    execute_javascript '$(".client").scope().$apply(function(){throw new Error()})'
    page.should have_selector('.title', text: 'The application needs to reload')
  end

end
