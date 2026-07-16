import type { UserIdentity } from "convex/server";

type TestDocument = Record<string, any> & { _id: string };
type SeedData = Record<string, Array<Record<string, any>>>;

class InMemoryQuery {
  constructor(private records: TestDocument[]) {}

  withIndex(_indexName: string, select: (query: any) => unknown) {
    let selected = this.records;
    const query = {
      eq(field: string, value: unknown) {
        selected = selected.filter((record) => record[field] === value);
        return query;
      },
    };

    select(query);
    this.records = selected;
    return this;
  }

  filter(select: (query: any) => { field: string; value: unknown }) {
    const expression = select({
      field: (field: string) => ({ field }),
      eq: (left: { field: string }, value: unknown) => ({ field: left.field, value }),
    });
    this.records = this.records.filter((record) => record[expression.field] === expression.value);
    return this;
  }

  async collect() {
    return [...this.records];
  }

  async first() {
    return this.records[0] ?? null;
  }
}

export class InMemoryConvexDb {
  private readonly tables = new Map<string, TestDocument[]>();
  private nextId = 1;

  readonly system: {
    get: (table: string, id: string) => Promise<TestDocument | null>;
  };

  constructor(seed: SeedData = {}) {
    for (const [table, records] of Object.entries(seed)) {
      this.tables.set(
        table,
        records.map((record) => ({
          _id: String(record._id ?? `${table}:${this.nextId++}`),
          ...record,
        })),
      );
    }

    this.system = {
      get: async (_table: string, id: string) => this.rows("_storage").find((record) => record._id === id) ?? null,
    };
  }

  query(table: string) {
    return new InMemoryQuery(this.rows(table));
  }

  async insert(table: string, value: Record<string, any>) {
    const id = `${table}:${this.nextId++}`;
    this.rows(table).push({ _id: id, ...value });
    return id;
  }

  async patch(id: string, value: Record<string, any>) {
    const record = this.findById(id);

    if (!record) {
      throw new Error(`Missing test record: ${id}`);
    }

    Object.assign(record, value);
  }

  async delete(id: string) {
    for (const records of this.tables.values()) {
      const index = records.findIndex((record) => record._id === id);

      if (index >= 0) {
        records.splice(index, 1);
        return;
      }
    }
  }

  rows(table: string) {
    let records = this.tables.get(table);

    if (!records) {
      records = [];
      this.tables.set(table, records);
    }

    return records;
  }

  private findById(id: string) {
    for (const records of this.tables.values()) {
      const record = records.find((candidate) => candidate._id === id);

      if (record) {
        return record;
      }
    }

    return null;
  }
}

export function clerkIdentity(userId: string, overrides: Partial<UserIdentity> = {}): UserIdentity {
  return {
    tokenIdentifier: `https://clerk.example|${userId}`,
    subject: userId,
    issuer: "https://clerk.example",
    email: `${userId.toLowerCase()}@example.com`,
    ...overrides,
  };
}

export function convexTestContext(db: InMemoryConvexDb, identity: UserIdentity | null) {
  return {
    auth: {
      getUserIdentity: async () => identity,
    },
    db,
    storage: {
      delete: async () => undefined,
      generateUploadUrl: async () => "https://upload.example.test",
      getUrl: async (storageId: string) => `https://media.example.test/${storageId}`,
    },
  } as any;
}

export function convexHandler<Args = any, Result = any>(registeredFunction: unknown) {
  return (registeredFunction as { _handler: (ctx: any, args: Args) => Result })._handler;
}
