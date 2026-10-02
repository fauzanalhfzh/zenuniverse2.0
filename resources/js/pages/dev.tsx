import { Head } from '@inertiajs/react';
import { useState } from 'react';
import './dev.css';

export default function Dev() {
    const [pressed, setPressed] = useState<string | null>(null);

    return (
        <>
            <Head title="Preview button" />
            <main className="dev-preview">
                <h1>Preview button pelajaran</h1>
                <p>Lingkaran CSS, shadow x=3px, y=5px, blur=0.</p>
                <div className="dev-preview-stage">
                    {['Book', 'Code', 'Quiz'].map((icon) => (
                        <button
                            key={icon}
                            type="button"
                            className={`dev-lesson-button${pressed === icon ? ' is-popping' : ''}`}
                            aria-label={`Coba button ${icon}`}
                            onClick={() => setPressed(icon)}
                            onAnimationEnd={() =>
                                setPressed((current) =>
                                    current === icon ? null : current,
                                )
                            }
                        >
                            <img
                                src={`/images/path-node/${icon}.png`}
                                alt=""
                                width={50}
                                height={50}
                            />
                        </button>
                    ))}
                </div>
                <p>Ikon Book, Code, dan Quiz dari gambar lokal.</p>
                <p>Klik atau tekan Space. Button kembali otomatis.</p>
            </main>
        </>
    );
}
