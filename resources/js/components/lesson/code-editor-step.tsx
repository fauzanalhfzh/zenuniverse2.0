import Editor from '@monaco-editor/react';
import { useEffect, useState } from 'react';
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

    useEffect(() => {
        setupMonaco();
    }, []);

    return (
        <div className="flex flex-col gap-5">
            {step.content.title ? (
                <h2 className="font-display text-2xl font-bold text-slate-900">
                    {step.content.title}
                </h2>
            ) : null}
            {step.content.prompt ? (
                <p className="leading-relaxed text-slate-600">
                    {step.content.prompt}
                </p>
            ) : null}

            <div className="border-border overflow-hidden rounded-2xl border-2">
                <Editor
                    height="320px"
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

            <div>
                <Button onClick={() => onSubmit(code)} disabled={pending}>
                    {pending ? 'Memeriksa...' : 'Jalankan & periksa'}
                </Button>
            </div>
        </div>
    );
}
