import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../resources/css/app.css';
import { CodeFillStepView } from '@/components/lesson/code-fill-step';
import { QuizStepView } from '@/components/lesson/quiz-step';
import { quizPresentation } from '@/lib/lesson/quiz-presentation';
import type { CodeFillStep } from '@/types/lesson';
import type { QuizStep } from '@/types/lesson';

const single: CodeFillStep = {
    id: 'single',
    type: 'code-fill',
    reward: { xp: 5 },
    content: {
        instructions: 'Pilih nilai bertipe integer untuk variabel score.',
        language: 'python',
        parts: ['score = ', '\nprint(score)'],
        blanks: [
            {
                id: 'blank-1',
                mode: 'choice',
                options: ['100', '"100"', 'True', 'score'],
            },
        ],
        hint: 'Integer ditulis tanpa tanda kutip.',
    },
};
const multiple: CodeFillStep = {
    ...single,
    id: 'multiple',
    content: {
        ...single.content,
        parts: ['left = ', '\nright = ', '\nname = ', ''],
        blanks: [
            { id: 'blank-1', mode: 'choice', options: ['100', 'True'] },
            { id: 'blank-2', mode: 'choice', options: ['100', 'False'] },
            { id: 'blank-3', mode: 'text' },
        ],
    },
};
function Fixture() {
    const params = new URLSearchParams(location.search);
    const quiz: QuizStep = {
        id: 'quiz',
        type: 'quiz',
        reward: { xp: 5 },
        content: {
            code: params.has('authored')
                ? 'nilai = 75\nif nilai >= 60:\n    print("Lulus")'
                : undefined,
            language: 'python',
            question: params.has('plain')
                ? 'Apa kegunaan variabel?'
                : params.has('authored')
                  ? 'Apa output kode berikut?'
                  : 'Apa nilai akhir score setelah score = 10 lalu score = 20?',
            options: [
                { id: 'a', label: '20' },
                { id: 'b', label: '10' },
                { id: 'c', label: '30' },
                { id: 'd', label: 'Tidak memiliki nilai' },
            ],
        },
    };
    const [selected, setSelected] = useState<string>();
    const [step, setStep] = useState(
        new URLSearchParams(location.search).has('multiple')
            ? multiple
            : single,
    );
    const [pending, setPending] = useState(false);
    const [submitted, setSubmitted] = useState('');
    return (
        <main
            className="lesson-player"
            style={{ minHeight: '100vh', padding: '24px' }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: 900,
                    margin: 'auto',
                    padding: '16px',
                    background: 'white',
                    borderRadius: 16,
                }}
            >
                <h1>
                    {params.has('quiz')
                        ? quizPresentation(
                              quiz.content.question,
                              'python',
                              quiz.content.code,
                          ).question
                        : 'Lengkapi nilai angka'}
                </h1>
                {params.has('quiz') ? (
                    <QuizStepView
                        step={quiz}
                        language="python"
                        disabled={pending}
                        selectedId={selected}
                        onSelect={setSelected}
                    />
                ) : (
                    <CodeFillStepView
                        step={step}
                        pending={pending}
                        onSubmit={(answers) =>
                            setSubmitted(JSON.stringify(answers))
                        }
                    />
                )}
                <output data-testid="submitted">{submitted}</output>
                <div style={{ marginTop: 24 }}>
                    <button onClick={() => setPending((value) => !value)}>
                        Ubah pending
                    </button>
                    <button onClick={() => setStep({ ...single, id: 'next' })}>
                        Materi berikutnya
                    </button>
                </div>
            </div>
        </main>
    );
}
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Fixture />
    </StrictMode>,
);
