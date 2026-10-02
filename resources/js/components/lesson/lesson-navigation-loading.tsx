import { Dialog } from '@base-ui/react/dialog';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import './lesson-navigation-loading.css';

type Loading = {
    onCancel: () => void;
    returnFocus: RefObject<HTMLElement | null>;
};

const LoadingContext = createContext({
    start: (_loading: Loading) => {},
    finish: (_cancelled = false) => {},
});

export const useLessonNavigationLoading = () => useContext(LoadingContext);

export default function LessonNavigationLoading({
    children,
}: {
    children: ReactNode;
}) {
    const [loading, setLoading] = useState<Loading | null>(null);
    const startedAt = useRef(0);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cancelButton = useRef<HTMLButtonElement>(null);

    useEffect(
        () => () => {
            if (timer.current) clearTimeout(timer.current);
        },
        [],
    );

    function start(next: Loading) {
        if (timer.current) clearTimeout(timer.current);
        startedAt.current = performance.now();
        setLoading(next);
    }

    function finish(cancelled = false) {
        if (cancelled) startedAt.current = 0;
        if (timer.current) clearTimeout(timer.current);
        const remaining = cancelled
            ? 0
            : Math.max(0, 1000 - (performance.now() - startedAt.current));
        timer.current = setTimeout(() => setLoading(null), remaining);
    }

    function cancel() {
        loading?.onCancel();
        finish(true);
    }

    return (
        <LoadingContext.Provider value={{ start, finish }}>
            {children}
            {loading && (
                <Dialog.Root open onOpenChange={(open) => !open && cancel()}>
                    <Dialog.Portal>
                        <Dialog.Backdrop className="lesson-loading-backdrop" />
                        <Dialog.Popup
                            initialFocus={cancelButton}
                            finalFocus={loading.returnFocus}
                            className="lesson-loading-screen"
                        >
                            <div className="lesson-loading-content">
                                <img
                                    src="/images/loading.png"
                                    alt=""
                                    width={160}
                                    height={160}
                                    className="lesson-loading-character"
                                />
                                <Dialog.Title className="font-display lesson-loading-title">
                                    Menyiapkan misimu...
                                </Dialog.Title>
                                <Dialog.Description className="lesson-loading-description">
                                    Sebentar, pelajaranmu sedang dimuat.
                                </Dialog.Description>
                                <div
                                    role="status"
                                    aria-label="Memuat pelajaran"
                                    className="lesson-loading-track"
                                >
                                    <span />
                                </div>
                            </div>
                            <Dialog.Close
                                ref={cancelButton}
                                className="lesson-loading-cancel"
                            >
                                Batal
                            </Dialog.Close>
                        </Dialog.Popup>
                    </Dialog.Portal>
                </Dialog.Root>
            )}
        </LoadingContext.Provider>
    );
}
