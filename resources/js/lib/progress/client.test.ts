import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiClient, ApiError } from './client';

function jsonResponse(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

function toUrl(input: string | URL | Request): string {
    if (typeof input === 'string') {
        return input;
    }

    return input instanceof URL ? input.toString() : input.url;
}

function withFetch(
    handler: (url: string, init?: RequestInit) => Promise<Response>,
): () => void {
    const original = globalThis.fetch;
    globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) =>
        handler(toUrl(url), init)) as typeof fetch;

    return () => {
        globalThis.fetch = original;
    };
}

void test('post attaches csrf and json headers', async () => {
    let captured: RequestInit | undefined;
    const restore = withFetch(async (_url, init) => {
        captured = init;
        return jsonResponse(200, { ok: true });
    });

    try {
        const client = new ApiClient(() => 'token-123');
        const data = await client.post<{ ok: boolean }>('/learning/attempts', {
            a: 1,
        });

        assert.deepEqual(data, { ok: true });

        const headers = captured?.headers as Record<string, string>;
        assert.equal(headers['X-XSRF-TOKEN'], 'token-123');
        assert.equal(headers['Content-Type'], 'application/json');
        assert.equal(captured?.credentials, 'same-origin');
        assert.equal(captured?.body, JSON.stringify({ a: 1 }));
    } finally {
        restore();
    }
});

void test('get does not send csrf token', async () => {
    let captured: RequestInit | undefined;
    const restore = withFetch(async (_url, init) => {
        captured = init;
        return jsonResponse(200, {});
    });

    try {
        const client = new ApiClient(() => 'token-123');
        await client.get('/me/progress');

        const headers = captured?.headers as Record<string, string>;
        assert.equal(headers['X-XSRF-TOKEN'], undefined);
        assert.equal(captured?.body, undefined);
    } finally {
        restore();
    }
});

void test('error payload becomes ApiError with code', async () => {
    const restore = withFetch(async () =>
        jsonResponse(409, {
            error: { code: 'content_changed', message: 'Muat ulang' },
        }),
    );

    try {
        const client = new ApiClient(() => null);

        await assert.rejects(
            () => client.post('/learning/attempts', {}),
            (error: unknown) => {
                assert.ok(error instanceof ApiError);
                assert.equal(error.status, 409);
                assert.equal(error.code, 'content_changed');
                assert.equal(error.message, 'Muat ulang');
                assert.equal(error.isConflict, true);

                return true;
            },
        );
    } finally {
        restore();
    }
});

void test('204 returns undefined', async () => {
    const restore = withFetch(async () => new Response(null, { status: 204 }));

    try {
        const client = new ApiClient(() => null);
        const result = await client.delete('/admin/assets/1');

        assert.equal(result, undefined);
    } finally {
        restore();
    }
});
