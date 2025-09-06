# Page snapshot

```yaml
- dialog "Unhandled Runtime Error" [ref=e3]:
  - generic [ref=e5]:
    - generic [ref=e6]:
      - navigation [ref=e7]:
        - button "previous" [disabled] [ref=e8]:
          - img "previous" [ref=e9]
        - button "next" [disabled] [ref=e11]:
          - img "next" [ref=e12]
        - generic [ref=e14]:
          - generic [ref=e15]: "1"
          - text: of
          - generic [ref=e16]: "1"
          - text: error
        - generic [ref=e17]:
          - generic "An outdated version detected (latest is 15.5.2), upgrade is highly recommended!" [ref=e19]: Next.js (14.2.28) is outdated
          - link "(learn more)" [ref=e20]:
            - /url: https://nextjs.org/docs/messages/version-staleness
      - button "Close" [ref=e21] [cursor=pointer]:
        - img [ref=e23] [cursor=pointer]
    - heading "Unhandled Runtime Error" [level=1] [ref=e26]
    - paragraph [ref=e27]: "Error: async/await is not yet supported in Client Components, only Server Components. This error is often caused by accidentally adding `'use client'` to a module that was originally written for the server."
```