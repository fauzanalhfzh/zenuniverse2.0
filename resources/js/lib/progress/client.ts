export interface ApiErrorPayload {
    error?: { code?: string; message?: string };
    errors?: Record<string, string[]>;
}

export class ApiError extends Error {
    readonly status: number;

    readonly code: string;

    readonly fields: Record<string, string[]> | undefined;

    constructor(
        status: number,
        code: string,
        message: string,
        fields?: Record<string, string[]>,
    ) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.fields = fields;
    }

    get isUnauthenticated(): boolean {
        return this.status === 401;
    }

    get isConflict(): boolean {
        return this.status === 409;
    }

    get isCsrfExpired(): boolean {
        return this.status === 419;
    }
}

export type CsrfTokenProvider = () => string | null;

export interface RequestOptions {
    method?: string;
    body?: unknown;
    signal?: AbortSignal;
}

export function defaultCsrfToken(): string | null {
    if (typeof document === 'undefined') {
        return null;
    }

    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);

    if (match) {
        return decodeURIComponent(match[1]);
    }

    const meta = document.querySelector('meta[name="csrf-token"]');

    return meta?.getAttribute('content') ?? null;
}

/**
 * Same-origin JSON transport for lesson submissions. It relies on the Laravel
 * session cookie and CSRF token instead of bearer tokens in localStorage.
 */
export class ApiClient {
    private readonly csrf: CsrfTokenProvider;

    constructor(csrf: CsrfTokenProvider = defaultCsrfToken) {
        this.csrf = csrf;
    }

    get<T>(url: string, options: RequestOptions = {}): Promise<T> {
        return this.request<T>(url, { ...options, method: 'GET' });
    }

    post<T>(
        url: string,
        body?: unknown,
        options: RequestOptions = {},
    ): Promise<T> {
        return this.request<T>(url, { ...options, method: 'POST', body });
    }

    put<T>(
        url: string,
        body?: unknown,
        options: RequestOptions = {},
    ): Promise<T> {
        return this.request<T>(url, { ...options, method: 'PUT', body });
    }

    delete<T>(url: string, options: RequestOptions = {}): Promise<T> {
        return this.request<T>(url, { ...options, method: 'DELETE' });
    }

    async request<T>(url: string, options: RequestOptions = {}): Promise<T> {
        const method = (options.method ?? 'GET').toUpperCase();
        const headers: Record<string, string> = {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        };

        if (options.body !== undefined) {
            headers['Content-Type'] = 'application/json';
        }

        if (method !== 'GET' && method !== 'HEAD') {
            const token = this.csrf();

            if (token) {
                headers['X-XSRF-TOKEN'] = token;
            }
        }

        const response = await fetch(url, {
            method,
            headers,
            credentials: 'same-origin',
            body:
                options.body !== undefined
                    ? JSON.stringify(options.body)
                    : undefined,
            signal: options.signal,
        });

        if (!response.ok) {
            let payload: ApiErrorPayload | null = null;

            try {
                payload = (await response.json()) as ApiErrorPayload;
            } catch {
                payload = null;
            }

            throw new ApiError(
                response.status,
                payload?.error?.code ?? `http_${response.status}`,
                payload?.error?.message ?? response.statusText,
                payload?.errors,
            );
        }

        if (response.status === 204) {
            return undefined as T;
        }

        return (await response.json()) as T;
    }
}

export const api = new ApiClient();
