/**
 * Lightweight mock for the supabase JS client.
 * Tests focus on UI/logic — DB calls are stubbed.
 */
import { vi } from "vitest";

export const makeQueryBuilder = (data: any = null, error: any = null) => {
  const builder: any = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    upsert: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    neq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    or: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    range: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve({ data, error })),
    maybeSingle: vi.fn(() => Promise.resolve({ data, error })),
    then: (resolve: any) => Promise.resolve({ data, error }).then(resolve),
  };
  return builder;
};

export const mockSupabaseClient = {
  from: vi.fn(() => makeQueryBuilder()),
  rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: { id: "test-user-id" } }, error: null })),
    getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    signInWithPassword: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    signUp: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
    signInWithOAuth: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    resetPasswordForEmail: vi.fn(() => Promise.resolve({ error: null })),
    updateUser: vi.fn(() => Promise.resolve({ data: {}, error: null })),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(() => Promise.resolve({ data: { path: "x" }, error: null })),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://example.com/x.png" } })),
      remove: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    unsubscribe: vi.fn(),
  })),
  removeChannel: vi.fn(),
};
