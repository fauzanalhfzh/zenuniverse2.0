import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

import { LoginModal } from '@/components/auth/login-modal';

/** Where a successful sign-in from the modal should land. */
const DEFAULT_REDIRECT = '/dashboard';

interface LoginModalContextValue {
    open: boolean;
    openLogin: (nextPath?: string) => void;
    closeLogin: () => void;
}

const LoginModalContext = createContext<LoginModalContextValue | null>(null);

/**
 * Global login-modal provider. Any component can call
 * `useLoginModal().openLogin()` instead of navigating to /login —
 * the Google OAuth flow renders in an overlay dialog.
 */
export function LoginProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const [nextPath, setNextPath] = useState(DEFAULT_REDIRECT);

    const openLogin = useCallback((path?: string) => {
        setNextPath(path ?? DEFAULT_REDIRECT);
        setOpen(true);
    }, []);

    const closeLogin = useCallback(() => setOpen(false), []);

    const value = useMemo(
        () => ({ open, openLogin, closeLogin }),
        [open, openLogin, closeLogin],
    );

    return (
        <LoginModalContext.Provider value={value}>
            {children}
            <LoginModal open={open} nextPath={nextPath} onClose={closeLogin} />
        </LoginModalContext.Provider>
    );
}

export function useLoginModal() {
    const ctx = useContext(LoginModalContext);
    if (!ctx) {
        throw new Error('useLoginModal must be used within <LoginProvider>');
    }
    return ctx;
}
