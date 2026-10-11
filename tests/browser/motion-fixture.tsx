import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
    HeartMeter,
    MotionAsset,
} from '../../resources/js/components/motion/motion-asset';
import type { MotionAssetKind } from '../../resources/js/components/motion/motion-asset';
import '@fontsource/figtree/400.css';
import '@fontsource/figtree/600.css';
import '@fontsource/fredoka/500.css';
import './motion-preview.css';

const assets: {
    title: string;
    description: string;
    kind: MotionAssetKind;
    filled?: boolean;
    timing: string;
}[] = [
    {
        title: 'Fill heart',
        description: 'Nyawa kembali. Warna naik, lalu hati memantul kecil.',
        kind: 'heart',
        timing: '620 ms',
    },
    {
        title: 'Unfill heart',
        description:
            'Nyawa berkurang. Warna turun, bentuk hati tetap terlihat.',
        kind: 'heart',
        filled: false,
        timing: '320 ms',
    },
    {
        title: 'Unlimited Heart',
        description:
            'Nyawa tanpa batas. Hati menyambut, simbol tak hingga muncul.',
        kind: 'unlimited-heart',
        timing: '620 ms',
    },
    {
        title: 'Main Mascot',
        description: 'Astronaut meluncur pelan, lalu kembali tenang.',
        kind: 'mascot',
        timing: '1.400 ms',
    },
    {
        title: 'Stars',
        description: 'XP bertambah. Bintang berputar sedikit dengan dua kilau.',
        kind: 'star',
        timing: '620 ms',
    },
    {
        title: 'Streaks',
        description: 'Hari belajar bertambah. Api memanjang, lalu mereda.',
        kind: 'streak',
        timing: '620 ms',
    },
];

function Preview() {
    const [selected, setSelected] = useState<number | null>(null);
    const [replay, setReplay] = useState(0);
    const [motion, setMotion] = useState(true);
    const [dark, setDark] = useState(false);
    const [hearts, setHearts] = useState(3);
    const [unlimited, setUnlimited] = useState(false);
    return (
        <main className={`motion-preview ${dark ? 'dark' : ''}`}>
            <div className="motion-preview__page">
                <header className="motion-preview__header">
                    <div>
                        <p className="motion-preview__brand">
                            Zenuniverse / Motion assets
                        </p>
                        <h1>
                            Gerakan kecil.
                            <br />
                            Belajar terasa hidup.
                        </h1>
                        <p>
                            Enam aset untuk merespons kemajuan belajar. Pilih
                            satu untuk melihat gerakannya.
                        </p>
                    </div>
                    <div className="motion-preview__settings">
                        <label>
                            <input
                                type="checkbox"
                                checked={motion}
                                onChange={(event) =>
                                    setMotion(event.target.checked)
                                }
                            />{' '}
                            Animasi aktif
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={dark}
                                onChange={(event) =>
                                    setDark(event.target.checked)
                                }
                            />{' '}
                            Latar gelap
                        </label>
                    </div>
                </header>
                <section
                    className="motion-preview__assets"
                    aria-label="Enam aset animasi"
                >
                    {assets.map((asset, index) => (
                        <article
                            key={asset.title}
                            className="motion-preview__asset"
                        >
                            <div className="motion-preview__stage">
                                <MotionAsset
                                    key={`${selected === index ? replay : 0}`}
                                    kind={asset.kind}
                                    filled={asset.filled}
                                    size={asset.kind === 'mascot' ? 156 : 88}
                                    playOnMount={selected === index}
                                    motion={motion}
                                    label={asset.title}
                                />
                            </div>
                            <div className="motion-preview__asset-title">
                                <h2>{asset.title}</h2>
                                <span>{asset.timing}</span>
                            </div>
                            <p>{asset.description}</p>
                            <button
                                onClick={() => {
                                    setSelected(index);
                                    setReplay((value) => value + 1);
                                }}
                                aria-label={`Putar ${asset.title}`}
                            >
                                Putar animasi <span aria-hidden="true">↻</span>
                            </button>
                        </article>
                    ))}
                </section>
                <section
                    className="motion-preview__context"
                    aria-labelledby="heart-demo-title"
                >
                    <div>
                        <p className="motion-preview__brand">
                            Coba dalam konteks
                        </p>
                        <h2 id="heart-demo-title">Nyawa saat belajar</h2>
                        <p>Simulasi lokal untuk mencoba perubahan nyawa.</p>
                    </div>
                    <div className="motion-preview__meter">
                        <div
                            role="img"
                            aria-label={
                                unlimited
                                    ? 'Nyawa tanpa batas'
                                    : `${hearts} dari 5 nyawa`
                            }
                        >
                            <HeartMeter
                                hearts={hearts}
                                capacity={5}
                                unlimited={unlimited}
                                size={36}
                                motion={motion}
                            />
                        </div>
                        <p aria-live="polite">
                            {unlimited
                                ? 'Nyawa tanpa batas'
                                : `${hearts} dari 5 nyawa`}
                        </p>
                        <div className="motion-preview__controls">
                            <button
                                disabled={unlimited || hearts === 0}
                                onClick={() => setHearts((value) => value - 1)}
                            >
                                Kurangi nyawa
                            </button>
                            <button
                                disabled={unlimited || hearts === 5}
                                onClick={() => setHearts((value) => value + 1)}
                            >
                                Isi nyawa
                            </button>
                            <button
                                aria-pressed={unlimited}
                                onClick={() => setUnlimited((value) => !value)}
                            >
                                Unlimited {unlimited ? 'aktif' : 'nonaktif'}
                            </button>
                        </div>
                    </div>
                </section>
                <footer>
                    Gerakan berhenti setelah selesai. Preferensi reduced motion
                    dari perangkat selalu diutamakan.
                </footer>
            </div>
        </main>
    );
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Preview />
    </StrictMode>,
);
