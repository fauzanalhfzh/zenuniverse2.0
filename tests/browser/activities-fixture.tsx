import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
    UnjumbleStepView,
    MatchingStepView,
    FlashcardStepView,
} from '@/components/lesson/activity-steps';
import '@/../css/app.css';

function Fixture() {
    const [pending, setPending] = useState(false);
    const [result, setResult] = useState('');
    const mode = new URLSearchParams(location.search).get('mode');
    const base = { id: 'synthetic', reward: { xp: 5 } };
    const shared = {
        disabled: pending,
        onSubmit: (answer: unknown) => {
            setResult(JSON.stringify(answer));
            setPending(true);
        },
    };
    return (
        <main style={{ maxWidth: 860, margin: '40px auto', padding: 20 }}>
            <h1>Latihan AI</h1>
            {mode === 'matching' ? (
                <MatchingStepView
                    {...shared}
                    step={{
                        ...base,
                        type: 'matching',
                        content: {
                            title: 'Pasangkan istilah',
                            instructions: 'Pilih istilah dan artinya.',
                            left: [
                                { id: 'a', label: 'Data latih' },
                                { id: 'b', label: 'Data uji' },
                            ],
                            right: [
                                {
                                    id: 'y',
                                    label: 'Contoh terpisah untuk evaluasi model',
                                },
                                {
                                    id: 'x',
                                    label: 'Contoh untuk mempelajari pola',
                                },
                            ],
                        },
                    }}
                />
            ) : mode === 'flashcard' ? (
                <FlashcardStepView
                    {...shared}
                    step={{
                        ...base,
                        type: 'flashcard',
                        content: {
                            title: 'Ulas istilah',
                            instructions: 'Buka semua kartu.',
                            cards: [
                                {
                                    id: 'one',
                                    front: 'Apa itu data latih?',
                                    back: 'Contoh untuk mempelajari pola.',
                                },
                                {
                                    id: 'two',
                                    front: 'Apa itu data uji?',
                                    back: 'Contoh terpisah untuk evaluasi.',
                                },
                            ],
                        },
                    }}
                />
            ) : (
                <UnjumbleStepView
                    {...shared}
                    step={{
                        ...base,
                        type: 'unjumble',
                        content: {
                            title: 'Susun gagasan',
                            instructions: 'Susun kalimat.',
                            tokens: [
                                { id: 'c', label: 'dalam data.' },
                                { id: 'a', label: 'AI' },
                                { id: 'b', label: 'mengenali pola' },
                            ],
                        },
                    }}
                />
            )}
            <output aria-label="Jawaban terkirim">{result}</output>
        </main>
    );
}
createRoot(document.getElementById('root')!).render(<Fixture />);
