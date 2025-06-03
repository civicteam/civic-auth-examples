Feature: Log in with vanillajs app (modal)

  Scenario: Log in with vanillajs app using modal mode
    Given I open the app home page
    And I click the modal sign in button
    And I click log in with dummy in the iframe

  Scenario: Verify login
    Then I confirm vanilla js I am logged in
    
  Scenario: Logout successfully
    When I click the vanilla js logout button
    Then I confirm vanilla js successful logout
    And I confirm token refresh fails after logout 