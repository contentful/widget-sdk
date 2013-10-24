require 'spec_helper'

feature 'Tutorial', js: true, non_ci: true do
  before do
    ensure_login
    remove_test_space 'Playground'
    create_test_space
  end

  after do
    remove_test_space 'Playground'
  end

  def open_tutorial_overview
    within 'nav.account .user' do
      find('.dropdown-toggle').click
      find('li', text: 'Start Tutorial').click
    end
    sleep 2
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

    add_button 'Content Type'

    within('.tab-content', visible:true) do
      fill_in 'contentTypeName', with: 'Blog Post'
      fill_in 'contentTypeDescription', with: 'Foobar'

      fill_in 'newName', with: 'Title'
      find('.button.new').click

      fill_in 'newName', with: 'Content'
      find('.button.new').click

      fill_in 'newName', with: 'Timestamp'
      find('.type .dropdown-toggle').click
      find(:xpath, ".//span[text()='Date/Time']/..").click
      find('.button.new').click
    end
    click_link 'Next'

    find('.publish').click

    nav_bar 'content-type-list'

    click_button 'Yes, please'

    finish_tutorial do
      all('td.cell-name').should have(6).elements
    end
  end

  def run_entry_tutorial
    find('.middle.tutorial-select-box .take').click
    click_link 'Next'
    using_wait_time 20 do
      find('.guiders_title', text:'Click on the Add button!')
    end

    add_button 'Blog Post'

    3.times do
      click_link 'Next'
    end

    all('textarea')[0..2].each do |ta|
      ta.set('Lorem ipsum dolor sit amet')
    end
    find('.date').click
    first('td[data-handler=selectDay] a').click
    click_button 'Publish'

    nav_bar 'entry-list'

    click_button 'Yes, please'

    finish_tutorial do
      all('td.cell-name').should have(11).elements
    end
  end

  def run_api_key_tutorial
    find('.right.tutorial-select-box .take').click
    click_link 'Next'
    add_button 'API Key'
    click_link 'Next'

    within('.tab-content', visible:true) do
      find('input[ng-model="apiKey.data.name"]').set 'Name'
      find('input[ng-model="apiKey.data.description"]').set 'Foobar'
      click_button 'Save'
    end

    click_link 'Next'

    nav_bar 'api-key-list'
    finish_tutorial do
      all('td.cell-name').should have(1).element
    end
  end

  #scenario 'Run Content Type tutorial' do
    #open_tutorial_overview
    #run_content_type_tutorial
    #close_tutorial_overview
  #end

  #scenario 'Run Entry tutorial' do
    #open_tutorial_overview
    #run_entry_tutorial
    #close_tutorial_overview
  #end

  #scenario 'Run API Key tutorial' do
    #open_tutorial_overview
    #run_api_key_tutorial
    #close_tutorial_overview
  #end

  scenario 'Run all Tutorials' do
    open_tutorial_overview
    run_content_type_tutorial
    run_entry_tutorial
    run_api_key_tutorial
    close_tutorial_overview
  end

end
