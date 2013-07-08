require 'spec_helper'

feature 'Tutorial', js: true do
  before do
    ensure_login
    remove_test_space
    create_test_space
  end

  after do
    remove_test_space
  end

  def open_tutorial_overview
    within 'nav.account .user' do
      find('.dropdown-toggle').click
      find('li', text: 'Start Tutorial').click
    end
  end

  def close_tutorial_overview
    find('#overview .guiders_close').click
  end

  def finish_tutorial
    using_wait_time 20 do
      find('a', text: 'Back to overview')
      yield if block_given?
    end
    click_link 'Back to overview'
  end

  def run_content_type_tutorial
    find('.left.tutorial-select-box .take').click
    click_link 'Next'
    find('.tablist-button .dropdown-toggle').click
    all('.tablist-button li', text: 'Content Type').first.click

    within('.tab-content', visible:true) do
      fill_in 'contentTypeName', with: 'Blog Post'
      fill_in 'contentTypeDescription', with: 'Foobar'

      fill_in 'newName', with: 'Title'
      find('.button.new').click

      fill_in 'newName', with: 'Content'
      find('.button.new').click

      fill_in 'newName', with: 'Timestamp'
      find('.type .dropdown-toggle').click
      #find('.type .li', text: 'Date/Time').click
      find(:xpath, ".//span[text()='Date/Time']/..").click
      find('.button.new').click
    end
    click_link 'Next'

    find('.publish').click

    all('.nav-bar li').first.click

    click_button 'Yes, please'

    finish_tutorial do
      all('.cell-name').should have(7).elements
    end
  end

  def run_entry_tutorial
    find('.middle.tutorial-select-box .take').click
    click_link 'Next'
    using_wait_time 20 do
      find('.guiders_title', text:'Click on the Add button!')
    end
    find('.tablist-button .dropdown-toggle').click
    all('.tablist-button li', text: 'Blog Post').first.click

    3.times do
      click_link 'Next'
    end

    within('.tab-content', visible:true) do
      all('textarea')[0..2].each do |ta|
        ta.set('Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.')
      end
      within '.cf-datetime-editor' do
        find('.date').click
        all('td[data-handler=selectDay] a')[5].click
      end
      click_button 'Publish'
    end

    find('.nav-bar li[data-view-type=entry-list]').first.click

    click_button 'Yes, please'

    finish_tutorial do
      all('.cell-name').should have(11).elements
    end
  end

  scenario 'Run Content Type tutorial' do
    open_tutorial_overview
    run_content_type_tutorial
    close_tutorial_overview
  end

  scenario 'Run Entry tutorial' do
    open_tutorial_overview
    run_entry_tutorial
    close_tutorial_overview
  end

end
