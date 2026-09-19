import { Button } from '@/components/ui/button';

export function UnsupportedStepView({ type }: { type: string }) {
    return (
        <div className="flex flex-col gap-4 rounded-2xl border-2 border-amber-200 bg-amber-50 p-5 text-amber-900">
            <p className="font-display text-lg font-bold">
                Langkah “{type}” belum tersedia di versi ini.
            </p>
            <p className="text-sm leading-relaxed">
                Renderer Blockly dan editor Monaco sedang dipindahkan. Langkah
                ini belum bisa dinilai, jadi kamu tidak kehilangan progress apa
                pun.
            </p>
            <div>
                <Button href="/dashboard" variant="outline">
                    Kembali ke dashboard
                </Button>
            </div>
        </div>
    );
}
