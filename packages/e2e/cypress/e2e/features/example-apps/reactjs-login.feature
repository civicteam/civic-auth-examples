Feature: Log in with reactjs app

  Scenario: Log in with reactjs app
    Given I open the 'REACT' app home page
    And I click the sign in button
    And I click log in with dummy in the iframe

  Scenario: Verify login
    Then I confirm I am logged in
    
  Scenario: Logout successfully
    When I click the logout button
    Then I confirm successful logout