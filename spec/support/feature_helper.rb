module FeatureHelper
  def self.included(feature)
    feature.let(:space_id){ page.evaluate_script "$('.client').scope().spaceContext.space.getId()" }
    feature.let(:tutorial_space_id) { page.evaluate_script "$('.client').scope().spaces.filter(function(s){return s.data.name === '#{test_space}'})[0].getId()" }
  end

  @@access_token = File.exist?('tmp/spec_token') ? File.read('tmp/spec_token') : nil

  def access_token
    @@access_token
  end

  def access_token=(t)
    @@access_token = t
    File.write('tmp/spec_token', t)
  end

  def clear_access_token
    File.delete('tmp/spec_token') if File.exist?('tmp/spec_token')
    @@access_token = nil
  end

  def ensure_login
    if access_token
      visit "#{app_host}/#access_token=#{access_token}"
    else
      visit "#{app_host}/"
    end

    begin
      page.find('.client', wait: 1)
    rescue Capybara::ElementNotFound
      visit "#{be_host}/" if current_url == "#{marketing_host}/"
      fill_in 'user_email', with: user
      fill_in 'user_password', with: password
      check 'remember_me'
      click_button 'Sign In'
    rescue Selenium::WebDriver::Error::UnhandledAlertError
      page.driver.browser.switch_to.alert.accept
      retry
    end

    begin
      find('#welcome .dot[data-index="4"]', wait: 0.5).click
      find('#welcome .guiders_x_button').click
      find('#restartHint .primary-button').click
    rescue Capybara::ElementNotFound
    end
    page.find('.client')
    self.access_token = page.evaluate_script('angular.element($(".client")).injector().get("authentication").token')
  end

  def ensure_logout
    visit "#{app_host}"

    if page.first('.client', wait: 5)
      find('.user .dropdown-toggle').click
      find('li', test: 'Log out').click
    else
      visit "#{be_host}/logout"
    end
    clear_access_token
  end

  def clear_cookies
    # https://makandracards.com/makandra/16117-how-to-clear-cookies-in-capybara-tests-both-selenium-and-rack-test
    browser = Capybara.current_session.driver.browser
    if browser.respond_to?(:clear_cookies)
      # Rack::MockSession
      browser.clear_cookies
    elsif browser.respond_to?(:manage) and browser.manage.respond_to?(:delete_all_cookies)
      # Selenium::WebDriver
      browser.manage.delete_all_cookies
    else
      raise "Don't know how to clear cookies. Weird driver?"
    end
  end

  def remove_test_space(name=test_space)
    within 'nav.account .project' do
      find('.dropdown-toggle').click
      begin
        find('li', text: name, wait: 0.5).click
      rescue Capybara::ElementNotFound
        find('.dropdown-toggle').click
        return
      end
    end

    within '.nav-bar' do
      all('li').last.click
    end

    settings_frame = find 'iframe'
    within_frame settings_frame do
      click_link 'Space'
      click_link 'Delete Space'
      accept_browser_dialog
    end
    expect_success 'Space has been deleted'
  end

  def create_test_space(name=test_space)
    find('.account .project .dropdown-toggle').click
    begin
      find('li', text: name, wait: 0.5).click
    rescue Capybara::ElementNotFound
      find('li', text: 'Create Space').click
      fill_in 'name', with: name
      fill_in 'locale', with: 'en-US'
      within ".modal-dialog" do
        click_button 'Create Space'
      end
      expect_success 'Created space'
    end
  end

  def add_button(text)
    find('.tablist-button .dropdown-toggle').click
    #begin
      #find('.tablist-button li[ng-click]', text: text).click
    #rescue Capybara::Ambiguous
      first('.tablist-button li[ng-click]', text: text).click
    #end
  end

  def nav_bar(target)
    find(".nav-bar li[data-view-type=#{target}]").click
  end

  def close_tab(title=nil)
    if title
      find(:xpath, "//*[@class='tab-title'][text()='#{title}']/../*[@class='close']").click
    else
      find('.tab-list .tab.active .close').click
    end
  end

  def eval_scope(selector, expression)
    page.execute_script %Q{$('#{selector.gsub("'", "\\\\'")}').scope().$eval('#{expression.gsub("'", "\\\\'")}')}
  end

  def apply_scope(selector)
    page.execute_script %Q{$('#{selector.gsub("'", "\\\\'")}').scope().$apply()}
  end

  def select_tab(title)
    find(:xpath, "//*[contains(@class,'tab-title')][text()='#{title}']/..").click
  end

  def wait_for_sharejs
    find('.save-status.saved')
  end

  def expect_success(string = 'published successfully')
    find('.notification', text: string, wait: 10)
  end

  def expect_error(string)
    find('.notification.error', text: string, wait: 10)
  end

  def eventually(options = {})
    # From https://github.com/alexch/wrong/blob/master/lib/wrong/eventually.rb
    timeout = options[:timeout] || Capybara.default_wait_time
    delay = options[:delay] || 0.5
    last_error = nil
    begin_time = Time.now
    while (Time.now - begin_time) < timeout
      begin
        value = yield
        return value
      rescue Exception => e
        last_error = e
        sleep delay
      end
    end
    raise last_error
  end

  def unscope
    scopes = page.send(:scopes)
    if scopes.length <= 1
      yield
    else
      begin
        scope = scopes.pop
        yield
      ensure
        scopes.push(scope)
      end
    end
  end
end
