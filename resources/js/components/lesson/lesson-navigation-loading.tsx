import { Dialog } from '@base-ui/react/dialog';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef } from 'react';
import type { RefObject } from 'react';

gsap.registerPlugin(useGSAP);

export default function LessonNavigationLoading({
    title,
    icon,
    onCancel,
    returnFocus,
}: {
    title: string;
    icon: string;
    onCancel: () => void;
    returnFocus: RefObject<HTMLElement | null>;
}) {
    const cancelButton = useRef<HTMLButtonElement>(null);

    return (
        <Dialog.Root open onOpenChange={(open) => !open && onCancel()}>
            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-50 bg-[#172033]/60" />
                <Dialog.Popup
                    initialFocus={cancelButton}
                    finalFocus={returnFocus}
                    className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4 overflow-y-auto rounded-[20px] bg-white px-6 py-8 text-center text-[#172033] sm:px-8 dark:bg-[#0e1931] dark:text-[#f4f6ff]"
                >
                    <LoadingOrbit icon={icon} />
                    <div className="flex w-full min-w-0 flex-col gap-2">
                        <Dialog.Title className="font-display text-2xl font-semibold">
                            Menyiapkan misi...
                        </Dialog.Title>
                        <Dialog.Description className="text-sm leading-6 wrap-anywhere text-[#4a5a70] dark:text-[#b7c5df]">
                            {title}
                        </Dialog.Description>
                    </div>
                    <p
                        role="status"
                        className="text-sm text-[#4a5a70] dark:text-[#b7c5df]"
                    >
                        Memuat pelajaran
                    </p>
                    <Dialog.Close
                        ref={cancelButton}
                        className="min-h-11 rounded-xl border border-[#5f6f85] px-6 text-sm font-bold text-[#4a5a70] hover:bg-[#eef3fa] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#a6400a] dark:border-[#b7c5df] dark:text-[#b7c5df] dark:hover:bg-[#182b4b] dark:focus-visible:outline-[#ff8a3d]"
                    >
                        Batal
                    </Dialog.Close>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

function LoadingOrbit({ icon }: { icon: string }) {
    const orbit = useRef<HTMLSpanElement>(null);

    useGSAP(() => {
        const media = gsap.matchMedia();
        media.add('(prefers-reduced-motion: no-preference)', () => {
            gsap.to(orbit.current, {
                rotation: 360,
                duration: 1.4,
                ease: 'none',
                repeat: -1,
            });
        });
        return () => media.revert();
    });

    return (
        <div
            className="relative grid size-24 shrink-0 place-items-center"
            aria-hidden="true"
        >
            <span
                ref={orbit}
                data-loading-orbit
                className="absolute inset-0 rounded-full border-[3px] border-[#e3eaf2] border-t-[#a6400a] dark:border-[#334563] dark:border-t-[#ff8a3d]"
            />
            <img
                src={`/images/path-node/${icon}.png`}
                alt=""
                className="size-12 object-contain"
            />
        </div>
    );
}
