module EnvHelper
  if ENV['USE_SAUCE'] || ENV['USE_QUIRELY']
    @@number = ENV['TEST_ENV_NUMBER']
    def app_host      ; 'https://app.quirely.com'          ; end
    def be_host       ; 'https://be.quirely.com'           ; end
    def marketing_host; 'https://www.quirely.com'          ; end
    def user          ; 'user@example.com'                 ; end
    def password      ; 'password'                         ; end
    def test_space    ; "TestSpace#{@@number}"             ; end
    def token_file    ; "tmp/spec_token_sauce_#{@@number}" ; end
  else
    def app_host      ; 'http://app.joistio.com:8888' ; end
    def be_host       ; 'http://be.joistio.com:8888'  ; end
    def marketing_host; 'http://www.joistio.com:8888' ; end
    def user          ; 'user@example.com'            ; end
    def password      ; 'password'                    ; end
    def test_space    ; 'TestSpace'                   ; end
    def token_file    ; 'tmp/spec_token'              ; end
  end
end
