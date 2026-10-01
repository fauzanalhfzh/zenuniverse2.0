import Editor from '@monaco-editor/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { setupMonaco } from '@/lib/content/monaco';
import type { CodeStep } from '@/types/lesson';

const languageMap: Record<string, string> = {
    python: 'python',
    javascript: 'javascript',
    cpp: 'cpp',
    html: 'html',
    css: 'css',
};

export function CodeEditorStepView({
    step,
    pending,
    onSubmit,
}: {
    step: CodeStep;
    pending: boolean;
    onSubmit: (code: string) => void;
}) {
    const [code, setCode] = useState(step.content.starterCode ?? '');
    const [output, setOutput] = useState('');
    const [running, setRunning] = useState(false);
    const [status, setStatus] = useState('');
    const workerRef = useRef<Worker | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isPython = (step.content.language ?? 'python') === 'python';

    function stop() {
        workerRef.current?.terminate();
        workerRef.current = null;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = null;
    }

    useEffect(() => {
        setupMonaco();
        return stop;
    }, []);

    function run() {
        if (!isPython) return;
        stop();
        setOutput('');
        setRunning(true);
        setStatus('Memuat Python...');
        const submittedCode = code;
        const worker = new Worker('/python-worker.js', { type: 'module' });
        workerRef.current = worker;
        const fail = (message: string) => {
            stop();
            setRunning(false);
            setStatus('Eksekusi gagal');
            setOutput((current) => current + message);
        };
        timerRef.current = setTimeout(
            () => fail('Python gagal dimuat. Periksa koneksi lalu coba lagi.'),
            60000,
        );
        worker.onerror = () =>
            fail('Runtime Python gagal. Periksa koneksi lalu coba lagi.');
        worker.onmessage = ({ data }) => {
            if (data.type === 'ready') {
                if (timerRef.current) clearTimeout(timerRef.current);
                setStatus('Menjalankan...');
                timerRef.current = setTimeout(
                    () => fail('Eksekusi dihentikan: batas waktu 5 detik.'),
                    5000,
                );
            } else if (data.type === 'output') {
                setOutput((current) => (current + data.text).slice(0, 20000));
            } else if (data.type === 'error') {
                fail(data.text);
            } else if (data.type === 'done') {
                stop();
                setRunning(false);
                setStatus('Eksekusi selesai');
            }
        };
        worker.postMessage({ code: submittedCode });
    }

    return (
        <div className="real-code">
            <div className="real-code__workspace">
                <aside className="real-code__instructions">
                    <div className="real-code__panel-header">Instruksi</div>
                    <div className="real-code__brief">
                        <p className="real-code__kicker">Tantangan Python</p>
                        <h2>{step.content.title}</h2>
                        <p>{step.content.prompt}</p>
                        {step.content.hint ? <p className="real-code__hint">{step.content.hint}</p> : null}
                    </div>
                </aside>
                <div className="real-code__editor">
                    <div className="real-code__panel-header">
                        <span>{step.content.language ?? 'python'}.{isPython ? 'py' : 'txt'}</span>
                        {isPython ? <button type="button" className="real-code__run" onClick={run} disabled={pending || running}>{running ? status : 'Jalankan kode'}</button> : null}
                    </div>
                    <Editor
                        height="100%"
                        language={
                            languageMap[step.content.language ?? 'python'] ??
                            'python'
                        }
                        value={code}
                        onChange={(value) => setCode(value ?? '')}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            scrollBeyondLastLine: false,
                            tabSize: 4,
                            automaticLayout: true,
                        }}
                    />
                </div>
                <section
                    aria-label="Terminal Python"
                    className="real-code__console"
                >
                    <header className="real-code__panel-header">
                        <strong>Console</strong>
                        <span role="status" className="text-xs text-slate-600">
                            {status}
                        </span>
                    </header>
                    <pre
                        tabIndex={0}
                        aria-label="Hasil eksekusi"
                        className="min-h-0 flex-1 overflow-auto p-4 font-mono text-sm focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-orange-400"
                    >
                        {isPython
                            ? output ||
                              (running
                                  ? 'Tunggu hasil eksekusi...'
                                  : 'Jalankan kode untuk melihat hasil print().')
                            : 'Eksekusi terminal baru tersedia untuk Python.'}
                    </pre>
                </section>
            </div>

            <div className="real-code__actions">
                <p>Jalankan kode untuk mencoba. Periksa jawaban saat sudah siap.</p>
                <Button onClick={() => onSubmit(code)} disabled={pending || running}>
                    {pending ? 'Memeriksa...' : 'Periksa jawaban'}
                </Button>
            </div>
        </div>
    );
}
