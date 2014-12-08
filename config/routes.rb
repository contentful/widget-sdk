Contentful::Application.routes.draw do
  root :to => 'application#index'

  match "*args" => 'application#index'
end
