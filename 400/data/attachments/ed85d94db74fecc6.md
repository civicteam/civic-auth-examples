# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - main [ref=e3]:
      - img "Next.js logo" [ref=e4]
      - button "Sign in" [ref=e5] [cursor=pointer]:
        - generic [ref=e7] [cursor=pointer]: Sign in
    - contentinfo [ref=e8]:
      - link "Learn" [ref=e9] [cursor=pointer]:
        - /url: https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app
        - img [ref=e10] [cursor=pointer]
        - text: Learn
      - link "Examples" [ref=e11] [cursor=pointer]:
        - /url: https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app
        - img [ref=e12] [cursor=pointer]
        - text: Examples
      - link "Go to nextjs.org →" [ref=e13] [cursor=pointer]:
        - /url: https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app
        - img [ref=e14] [cursor=pointer]
        - text: Go to nextjs.org →
  - alert [ref=e15]
```