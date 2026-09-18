const EXTENSIONS = ['.ts', '.tsx', '.mts', '/index.ts', '/index.tsx'];

export async function resolve(specifier, context, nextResolve) {
    try {
        return await nextResolve(specifier, context);
    } catch (error) {
        if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
            throw error;
        }

        for (const extension of EXTENSIONS) {
            try {
                return await nextResolve(specifier + extension, context);
            } catch {
                // try next candidate
            }
        }

        throw error;
    }
}
