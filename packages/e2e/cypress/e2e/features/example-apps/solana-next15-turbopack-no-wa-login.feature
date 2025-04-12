Feature: Confirm solana vite with wallet adapter logs in and shows balance

  Scenario: Confirm solana vite with wallet adapter logs in and shows balance
    Given I open the 'SOLANA_NEXT15_TURBO_NO_WA' app home page
    When I click the sign in button
    And I click log in with dummy in the iframe

  Scenario: Verify login
    Then I confirm solana login without wallet adapter