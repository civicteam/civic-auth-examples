Feature: Log in with reactjs app

  Scenario: Log in with reactjs app
    Given I open the 'REACT' app home page
    And I click the sign in button
    And I click log in with dummy in the iframe

  Scenario: Verify refresh token functionality
    When I fetch tokens from local storage
    And I store the refresh token from local storage
    Then I confirm token refresh is successful

  Scenario: Logout successfully
    When I click the logout button
    Then I confirm successful logout
    And I confirm token refresh fails after logout
