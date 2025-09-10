# Page snapshot

```yaml
- generic [ref=e1]:
  - link "← Back to Main Page" [ref=e2] [cursor=pointer]:
    - /url: index.html
  - heading "Civic Auth - Embedded Mode" [level=1] [ref=e3]
  - generic [ref=e4]:
    - button "Sign In (Embedded)" [active] [ref=e5] [cursor=pointer]
    - button "Sign Out" [ref=e6] [cursor=pointer]
  - generic [ref=e8]:
    - img [ref=e11]
    - iframe [ref=e15]:
      - generic [active]:
        - main:
          - status [ref=f1e2]:
            - img [ref=f1e3]
            - generic [ref=f1e6]: Loading...
        - region "Notifications (F8)":
          - list
        - alert [ref=f1e7]
```