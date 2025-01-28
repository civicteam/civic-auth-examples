@dev @prod
Feature: Log in with wagmi app

  Scenario: Log in with wagmi app
    Given I open the 'WAGMI' app home page
    And I click the sign in button
    And I click log in with dummy in the iframe

  Scenario: Verify refresh token functionality
    When I fetch tokens from local storage
    And I store the refresh token from local storage
    Then I confirm token refresh is successful

# Commenting out until we can get this working on both dev and prod. Right now it only works on prod
#  Scenario: Creating and connecting the wallet
#    Given I create the embedded wallet
#    When I connect the embedded wallet
#    Then The embedded wallet is connected

  Scenario: Logout successfully
    When I click the logout button
    Then I confirm successful logout
    And I confirm token refresh fails after logout
