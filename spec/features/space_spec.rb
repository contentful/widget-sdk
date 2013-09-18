require 'spec_helper'

feature 'Working with spaces', js: true do
  before do
    ensure_login
  end

  scenario 'creating and deleting a space' do
    within 'nav.account .project' do
      find('.dropdown-toggle').click
      all('li').last.click
    end
    within 'form[name=newSpaceForm]' do
      fill_in 'name', with: 'TestSpace'
      fill_in 'locale', with: 'en-US'
      click_button 'Create Space'
    end
    page.has_no_css? 'form[name=newSpaceForm]'
    within '.nav-bar' do
      all('li').last.click
    end
    sleep 5
    within_frame 0 do
      click_link 'Delete Space'
      accept_browser_dialog
    end
    sleep 2
  end
end
