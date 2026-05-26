Feature: Authentication - Login Module

    Background:
        Given I navigate to the OrangeHRM login page

    # TC01
    Scenario: Verify basic UI elements on the login page
        Then the page title should be correct
        And the core UI components Username, Password, and Login Button should be visible

    # TC02
    Scenario: Successful login with valid administrative credentials
        When I login with valid username "Admin" and password "admin123"
        Then I should be securely redirected to Dashboard page
        And the Dashboard header should be visible

    # TC05 
    Scenario: Verify the security masking of the password input field
        When I input text into the password field
        Then the entered characters should be securely masked as a password type

    # TC06
    Scenario: Form submission using the Enter key on the keyboard
        When I fill the form with valid credentials
        And I trigger the Enter keyboard event directly on the password input field
        Then I should be securely redirected to Dashboard page

    # TC10
    Scenario: Data sanitization handles leading and trailing whitespaces
        When I submit valid credentials that contain leading and trailing whitespaces
        Then the system should automatically trim whitespaces and log me in successfully

    # TC11
    Scenario: Form data is cleared upon page refresh
        When I input valid credentials but do not submit
        And I simulate pressing the browser refresh button
        Then the Username and Password fields should be completely cleared

    # TC16
    Scenario: Verify standard clipboard paste operations on the password field
        When I simulate a clipboard paste event with a secret text into the password field
        Then the system should accept the pasted input into the password field

    # ========================================================================
    # DATA-DRIVEN TESTING (Gom TC03, TC04, TC07, TC08, TC09, TC14, TC15)
    # ========================================================================
    Scenario Outline: Verify system validation and error handling for invalid or empty credentials
    When I attempt to login with username "<username>" and password "<password>"
    Then the system should reject the login
    And display the corresponding error message "<expected_error>"

    Examples:
      | Scenario Type        | username      | password      | expected_error      |
      | Invalid Password     | Admin         | wrongPass123  | Invalid credentials |
      | Invalid Username     | wrongUser     | admin123      | Invalid credentials |
      | Empty Both Fields    |               |               | Required            |
      | Empty Username       |               | admin123      | Required            |
      | Empty Password       | Admin         |               | Required            |
      | Case Sensitivity     | Admin         | ADMIN123      | Invalid credentials |
      | SQL Injection Bypass | ' OR '1'='1   | ' OR '1'='1   | Invalid credentials |

    # ========================================================================
    # SESSION & BROWSER ROUTING ACTIONS (TC12, TC13, TC17)
    # ========================================================================

    # TC12
    Scenario: System prevents returning to Login page via Back button after successful authentication
        Given I have successfully logged in and navigated to the Dashboard
        When I simulate pressing the browser Back button
        Then the system should redirect back to the Dashboard denying access to the Login form

    # TC13
    Scenario: Session persistence across multiple browser tabs
        Given I have opened the Login form on both Tab 1 and Tab 2
        When I authenticate successfully on Tab 1
        And I switch to Tab 2 and refresh the page
        Then Tab 2 should automatically bypass the login form and route to the Dashboard

    # TC17
    Scenario: Forceful session termination triggers immediate re-authentication
        Given I have successfully logged in and navigated to the Dashboard
        When my session is terminated by clearing browser cookies
        And I attempt to navigate to a protected internal module like PIM
        Then the system should revoke access and redirect me to the Login interface