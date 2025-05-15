# This scenario is triggered by starting the app with the environment variable LOGIN_SUCCESS_URL set to a custom URL,
# CI does this as a separate job which runs this spec only.

@loginSuccessUrl
Feature: Log in with nextjs app and test custom loginSuccessUrl
  Scenario: Log in with nextjs app
    Given I open the app home page
    And I click the sign in button
    And I click log in with dummy in the iframe

  Scenario: Verify login and redirect to the loginSuccessUrl
    Then I confirm I am logged in
    And I confirm the custom loginSuccessUrl is loaded