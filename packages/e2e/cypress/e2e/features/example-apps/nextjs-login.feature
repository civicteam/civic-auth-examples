@local @develop
Feature: Log in with nextjs app

  Scenario: Log in with nextjs app
    Given I open the 'NEXT_JS' app home page
    And I click the sign in button
    And I click log in with dummy in the iframe

  Scenario: Verify refresh token functionality
    When I fetch tokens from cookies
    And I store the refresh token
#    Then I confirm token refresh is successful

  Scenario: Logout successfully
    When I click the logout button
    Then I confirm successful logout
#    And I confirm token refresh fails after logout