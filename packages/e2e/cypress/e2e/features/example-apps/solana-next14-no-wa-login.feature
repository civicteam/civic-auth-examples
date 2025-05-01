Feature: Confirm solana next15 without wallet adapter logs in and shows balance

  Scenario: Confirm solana next14 without wallet adapter logs in and shows balance
    Given I open the app home page
    When I click the sign in button
    And I click log in with dummy in the iframe

  Scenario: Verify login
    Then I confirm solana login without wallet adapter