import { X } from 'lucide-react';
import { Dialog } from '@base-ui/react/dialog';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';

interface LoginModalProps {
    open: boolean;
    nextPath: string;
    onClose: () => void;
}

/**
 * Modal login — Google OAuth flow rendered as an overlay dialog
 * (Base UI Dialog primitive). Mirrors the styling of the /login page
 * AuthShell so both entry points look identical.
 */
export function LoginModal({ open, nextPath, onClose }: LoginModalProps) {
    return (
        <Dialog.Root
            open={open}
            onOpenChange={(isOpen) => !isOpen && onClose()}
        >
            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-70 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
                <Dialog.Popup className="fixed top-1/2 left-1/2 z-80 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-4xl border-4 border-slate-800 bg-white px-6 py-8 shadow-[0_10px_0_#0b1120] transition-transform duration-200 outline-none data-ending-style:scale-95 data-starting-style:scale-95 sm:px-10">
                    <Dialog.Close
                        aria-label="Tutup dialog masuk"
                        className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 focus-visible:ring-4 focus-visible:ring-[#9a3412] focus-visible:outline-none"
                    >
                        <X className="size-5" aria-hidden="true" />
                    </Dialog.Close>
                    <div className="mt-8 text-center">
                        <p className="font-display text-primary text-sm font-bold">
                            Pusat kendali pelajar
                        </p>
                        <Dialog.Title className="font-display mt-2 text-3xl leading-tight font-bold text-slate-900">
                            Masuk untuk lanjut belajar
                        </Dialog.Title>
                        <Dialog.Description className="mx-auto mt-3 max-w-sm text-base leading-relaxed text-slate-600">
                            Gunakan akun Google yang sama setiap kali kamu
                            kembali ke Zenuniverse.
                        </Dialog.Description>
                    </div>

                    <div className="mt-8">
                        <GoogleSignInButton nextPath={nextPath} />
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
