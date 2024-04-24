pp "howdy"
require "openai"
client = OpenAI::Client.new(access_token: ENV.fetch("OPENAI_API_KEY"))

raw_response = client.chat(
  parameters: {
    model: "gpt-3.5-turbo",
    messages: [ 
      { :role => "system", :content => "You are a helpful assistant."},
      { :role => "user", :content => "What are the best pizza places in chicago?"},
    ]
  }
)

pp raw_response
