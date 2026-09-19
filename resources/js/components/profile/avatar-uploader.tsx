import { router } from '@inertiajs/react';
import { Camera, LoaderCircle, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { AvatarImage } from './avatar-image';

export function AvatarUploader({
    avatarUrl,
    displayName,
}: {
    avatarUrl: string | null;
    displayName: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleFile(file: File | undefined) {
        if (!file) {
            return;
        }

        setError(null);
        setPending(true);

        const formData = new FormData();
        formData.set('avatar', file);

        router.post('/profile/avatar', formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                if (inputRef.current) {
                    inputRef.current.value = '';
                }
            },
            onError: (errors) => {
                setError(errors.avatar ?? 'Upload avatar gagal. Coba lagi.');
            },
            onFinish: () => setPending(false),
        });
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative">
                <AvatarImage
                    src={avatarUrl}
                    displayName={displayName}
                    loading="eager"
                    className="size-24 rounded-full border-4 border-white shadow-[0_6px_0_rgba(156,73,19,0.3)]"
                />
                <label className="bg-primary hover:bg-primary/90 absolute right-0 bottom-0 flex size-9 cursor-pointer items-center justify-center rounded-full border-2 border-white text-white shadow-sm">
                    <Camera className="size-4" aria-hidden="true" />
                    <span className="sr-only">Unggah avatar</span>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        disabled={pending}
                        onChange={(event) =>
                            handleFile(event.target.files?.[0])
                        }
                    />
                </label>
            </div>

            {pending ? (
                <p
                    role="status"
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500"
                >
                    <LoaderCircle
                        className="size-4 animate-spin motion-reduce:animate-none"
                        aria-hidden="true"
                    />
                    Mengunggah avatar...
                </p>
            ) : null}

            {error && !pending ? (
                <p
                    role="alert"
                    className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700"
                >
                    <X className="size-3.5" aria-hidden="true" />
                    {error}
                </p>
            ) : null}
        </div>
    );
}
