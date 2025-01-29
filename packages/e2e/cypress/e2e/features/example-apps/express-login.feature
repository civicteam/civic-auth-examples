Feature: Log in with express app

  Scenario: Log in with express app
    Given I open the 'EXPRESS' server app home page
    And I click log in with dummy in the page

# This is not working in cypress (works manually). Error is {"error":"Authentication failed","details":"Code verifier not found in storage"}
#  Scenario: Verify refresh token functionality
#    When I fetch tokens from cookies
#    And I store the refresh token
#    Then I confirm token refresh is successful

#  Scenario: Logout successfully
#    When I click the logout button
#    Then I confirm successful logout
#    And I confirm token refresh fails after logout
