# @umami/prisma-client

Prisma client wrapper

# Installation

```
pnpm add @umami/prisma-client
```

# Usage

```javascript
import { UmamiPrismaClient } from '@umami/prisma-client';
import { PrismaClient } from '@prisma/client';

const prisma = new UmamiPrismaClient({
  url: process.env.DATABASE_URL,
  prismaClient: PrismaClient
});

const user = await prisma.client.user.findUnique({
  where: {
    id: 123
  }
});
```

# License

MIT
