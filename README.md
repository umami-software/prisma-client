# @umami/prisma-client

Prisma client wrapper

# Installation

```
npm install @umami/prisma-client
```

# Usage

Declare an environment variable for the connection:

```
DATABASE_URL=postgresql://username:password@hostname:port/database
```

See https://www.prisma.io/docs/reference/database-reference/connection-urls

Example usage:

```javascript
import prisma from '@umami/prisma-client';

const user = await prisma.client.user.findUnique({
  where: {
    id: 123
  }
});
```

# License

MIT
