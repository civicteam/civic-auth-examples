# Page snapshot

```yaml
- generic [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e14]:
      - generic [ref=e16]:
        - heading "Login" [level=2] [ref=e17]
        - heading "Log in or create account" [level=2] [ref=e18]
      - generic [ref=e19]:
        - generic [ref=e22]:
          - button "Google" [ref=e23] [cursor=pointer]:
            - img "Google" [ref=e24]
          - button "Dummy" [active] [ref=e25] [cursor=pointer]:
            - img "Dummy" [ref=e26]
          - button "Github" [ref=e27] [cursor=pointer]:
            - img "Github" [ref=e28]
          - button "Discord" [ref=e29] [cursor=pointer]:
            - img "Discord" [ref=e30]
          - button "Facebook" [ref=e31] [cursor=pointer]:
            - img "Facebook" [ref=e32]
          - button "X" [ref=e33] [cursor=pointer]:
            - img "X" [ref=e34]
        - heading "OR" [level=2] [ref=e36]
        - generic [ref=e38]:
          - textbox "Email address" [ref=e39]
          - button [ref=e41] [cursor=pointer]:
            - img [ref=e42]
      - generic [ref=e45]:
        - generic [ref=e46]: Powered by
        - link [ref=e47] [cursor=pointer]:
          - /url: https://www.civic.com/
          - img [ref=e48]
  - region "Notifications (F8)":
    - list
  - alert [ref=e57]
```