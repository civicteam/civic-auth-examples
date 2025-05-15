Feature: Log in with nextjs app
  Scenario: Log in with nextjs app
    Given I open the app home page
    And I click the sign in button
    And I click log in with dummy in the iframe

  Scenario: Verify login
    Then I confirm I am logged in
    # Because we have not set the LOGIN_SUCCESS_URL env var:
    And I confirm the custom loginSuccessUrl is NOT loaded
    
  Scenario: Logout successfully
    When I click the logout button
    Then I confirm successful logout
    And I confirm token refresh fails after logout