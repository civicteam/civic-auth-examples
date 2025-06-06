# Civic Auth Example - NextJS (Pages Router)

This is an example of using Civic Auth with NextJS using the Pages Router.

## Getting Started

First, run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Integration Overview

This example demonstrates:

1. Setting up Civic Auth with NextJS Pages Router
2. Protecting routes with middleware
3. Getting user information in pages using getServerSideProps
4. Using the UserButton component
5. Custom sign-in implementation

## Environment Variables

Create a `.env.local` file in the root directory with:

```
CLIENT_ID=your_civic_client_id
```

Get your Client ID from the [Civic Auth Dashboard](https://auth.civic.com).
