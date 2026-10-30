import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = ts.transpileModule(
  fs.readFileSync(
    new URL("../src/app/api/public-leads/route.ts", import.meta.url),
    "utf8",
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;

function setup({
  signedIn = true,
  member = true,
  memberError = null,
  queryError = null,
  saveError = null,
} = {}) {
  const calls = [];
  const query = {
    select(...args) {
      calls.push(["select", ...args]);
      return this;
    },
    eq(...args) {
      calls.push(["eq", ...args]);
      return this;
    },
    ilike(...args) {
      calls.push(["ilike", ...args]);
      return this;
    },
    order(...args) {
      calls.push(["order", ...args]);
      return this;
    },
    range(...args) {
      calls.push(["range", ...args]);
      return Promise.resolve({
        data: [{ id: "lead-1" }],
        count: 26,
        error: queryError,
      });
    },
  };
  const session = {
    auth: {
      getUser: async () => ({
        data: { user: signedIn ? { id: "user-1" } : null },
        error: null,
      }),
    },
    from(table) {
      calls.push(["session.from", table]);
      if (table === "workspace_members") {
        const membership = {
          select() {
            return this;
          },
          eq(...args) {
            calls.push(["membership.eq", ...args]);
            return this;
          },
          limit() {
            return this;
          },
          maybeSingle: async () => ({
            data: member ? { user_id: "user-1" } : null,
            error: memberError,
          }),
        };
        return membership;
      }
      return query;
    },
  };
  const admin = {
    from(table) {
      calls.push(["admin.from", table]);
      return {
        insert(lead) {
          calls.push(["insert", lead]);
          return {
            select() {
              return {
                single: async () => ({
                  data: saveError ? null : { id: "saved-lead" },
                  error: saveError,
                }),
              };
            },
          };
        },
      };
    },
  };
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require(name) {
      if (name === "next/server")
        return {
          NextResponse: { json: (body, init) => Response.json(body, init) },
        };
      if (name === "@supabase/supabase-js")
        return { createClient: () => admin };
      if (name === "@/lib/supabase/server")
        return { createClient: () => session };
      throw new Error(`Unexpected dependency: ${name}`);
    },
    process: { env: {} },
    console: { error() {}, warn() {} },
    fetch() {
      throw new Error("External integrations must not be called");
    },
  });
  return { handlers: exports, calls };
}

const getRequest = (query = "") => ({
  nextUrl: new URL(`https://example.test/api/public-leads${query}`),
});
const lead = {
  full_name: "Test Lead",
  email: "test@example.test",
  phone: "+971500000000",
  country: "United Arab Emirates",
  interest: "Buying Property",
  lead_source: "landing_page",
};
const postRequest = (body = lead) => ({
  headers: new Headers(),
  json: async () => body,
});

test("anonymous users cannot list leads", async () => {
  const { handlers, calls } = setup({ signedIn: false });
  const response = await handlers.GET(getRequest());
  assert.equal(response.status, 401);
  assert.equal(calls.length, 0);
});

test("users without workspace membership cannot list leads", async () => {
  const { handlers, calls } = setup({ member: false });
  assert.equal((await handlers.GET(getRequest())).status, 403);
  assert(
    !calls.some(
      ([action, table]) =>
        action === "session.from" && table === "public_leads",
    ),
  );
});

test("membership lookup failures do not expose leads", async () => {
  const { handlers } = setup({
    memberError: { message: "database unavailable" },
  });
  assert.equal((await handlers.GET(getRequest())).status, 500);
});

test("members receive paginated landing leads using their session, without private metadata", async () => {
  const { handlers, calls } = setup();
  const response = await handlers.GET(getRequest("?page=2&search=Jane"));
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.total, 26);
  assert.equal(result.page, 2);
  assert.equal(result.pageSize, 25);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert(
    calls.some(
      ([action, key, value]) =>
        action === "eq" && key === "lead_source" && value === "landing_page",
    ),
  );
  assert(
    calls.some(
      ([action, from, to]) => action === "range" && from === 25 && to === 49,
    ),
  );
  assert(
    calls.some(
      ([action, key, value]) =>
        action === "ilike" && key === "full_name" && value === "%Jane%",
    ),
  );
  const columns = calls.find(([action]) => action === "select")[1];
  assert(!columns.includes("ip_address"));
  assert(!columns.includes("user_agent"));
  assert(!calls.some(([action]) => action === "admin.from"));
});

test("invalid pages fall back to the first page and search wildcards are escaped", async () => {
  const { handlers, calls } = setup();
  const result = await (
    await handlers.GET(getRequest("?page=Infinity&search=50%25_off"))
  ).json();
  assert.equal(result.page, 1);
  assert(
    calls.some(
      ([action, , value]) => action === "ilike" && value === "%50\\%\\_off%",
    ),
  );
});

test("database read failures are returned as errors, not empty results", async () => {
  const { handlers } = setup({
    queryError: { message: "database unavailable" },
  });
  assert.equal((await handlers.GET(getRequest())).status, 500);
});

test("public registrations save to the database without Google Sheets or email", async () => {
  const { handlers, calls } = setup();
  const response = await handlers.POST(postRequest());
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { success: true, id: "saved-lead" });
  const saved = calls.find(([action]) => action === "insert")[1];
  assert.equal(saved.full_name, lead.full_name);
  assert.equal(saved.country, lead.country);
  assert.equal(saved.lead_source, "landing_page");
});

test("failed database writes are not reported as successful registrations", async () => {
  const { handlers } = setup({
    saveError: { message: "database unavailable" },
  });
  assert.equal((await handlers.POST(postRequest())).status, 500);
});

test("invalid required fields are rejected before writing", async () => {
  for (const invalid of [{ full_name: "" }, { email: 123 }, { phone: null }]) {
    const { handlers, calls } = setup();
    assert.equal(
      (await handlers.POST(postRequest({ ...lead, ...invalid }))).status,
      400,
    );
    assert(!calls.some(([action]) => action === "insert"));
  }
});

test("public registrations remain rate limited", async () => {
  const { handlers } = setup();
  for (let index = 0; index < 5; index++)
    assert.equal((await handlers.POST(postRequest())).status, 201);
  assert.equal((await handlers.POST(postRequest())).status, 429);
});
