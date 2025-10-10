# Page snapshot

```yaml
- generic [ref=e3]:
  - heading "Civic Auth - OnSignIn Callback Test (ReactJS)" [level=1] [ref=e4]
  - generic [ref=e5]:
    - heading "Provider-Level onSignIn Callback" [level=2] [ref=e6]
    - paragraph [ref=e7]:
      - strong [ref=e8]: "Callback Count:"
      - text: "0"
    - button "Clear Callback Log" [ref=e9] [cursor=pointer]
    - generic [ref=e10]:
      - strong [ref=e11]: "Provider onSignIn Log:"
      - generic [ref=e13]: No provider callbacks logged yet
  - generic [ref=e14]:
    - heading "OnSignIn Callback Test Component" [level=3] [ref=e15]
    - generic [ref=e16]:
      - button "Signing in..." [disabled] [ref=e17] [cursor=pointer]
      - button "Signing out..." [disabled] [ref=e18]
      - button "Clear Log" [ref=e19] [cursor=pointer]
    - generic [ref=e20]:
      - strong [ref=e21]: "User Status:"
      - text: Not logged in
      - strong [ref=e22]: "Auth Status:"
      - text: authenticating
    - generic [ref=e23]:
      - strong [ref=e24]: "Callback Log:"
      - generic [ref=e25]:
        - generic [ref=e26]: "[2025-10-10T19:50:36.687Z] Auth status changed to: unauthenticated"
        - generic [ref=e27]: "[2025-10-10T19:50:38.654Z] Starting sign-in attempt"
        - generic [ref=e28]: "[2025-10-10T19:50:38.657Z] Auth status changed to: authenticating"
  - generic [ref=e29]:
    - heading "Test Instructions:" [level=3] [ref=e30]
    - list [ref=e31]:
      - listitem [ref=e32]: Click "Sign in" to test successful sign-in callback
      - listitem [ref=e33]: Try multiple sign-in attempts to verify callback is called each time
      - listitem [ref=e34]: Check both the provider-level log and component-level log
      - listitem [ref=e35]: Verify that onSignIn is called after each sign-in attempt
      - listitem [ref=e36]: Test logout and sign-in again to verify callback behavior
```