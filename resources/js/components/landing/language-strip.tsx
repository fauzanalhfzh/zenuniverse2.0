import { Blocks } from 'lucide-react';

const languages = [
    { label: 'Python', src: '/images/languages/python.png' },
    { label: 'JavaScript', src: '/images/languages/javascript.png' },
    { label: 'C++', src: '/images/languages/cpp.png' },
    { label: 'Lua', src: '/images/languages/lua.png' },
    { label: 'TypeScript', src: '/images/languages/typescript.png' },
    { label: 'Dart', src: '/images/languages/dart.png' },
    { label: 'Kotlin', src: '/images/languages/kotlin.png' },
] as const;

function LanguageItem({ label, src }: { label: string; src: string }) {
    return (
        <span className="flex items-center gap-2.5">
            <img
                src={src}
                alt=""
                width={32}
                height={32}
                className="size-8 object-contain"
            />
            <span className="text-[16px] font-bold text-[#475569]">
                {label}
            </span>
        </span>
    );
}

export function LanguageStrip() {
    return (
        <section
            aria-label="Bahasa pemrograman"
            className="border-y-2 border-[#e2e8f0] bg-white"
        >
            <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-center gap-x-7 gap-y-4 px-5 py-5 sm:px-10">
                <LanguageItem
                    label={languages[0].label}
                    src={languages[0].src}
                />
                <span className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-[7px] bg-[#ff8a3d]">
                        <Blocks
                            className="size-6 text-[#0f172a]"
                            aria-hidden="true"
                        />
                    </span>
                    <span className="text-[16px] font-bold text-[#475569]">
                        Codeblock
                    </span>
                </span>
                {languages.slice(1).map((language) => (
                    <LanguageItem
                        key={language.label}
                        label={language.label}
                        src={language.src}
                    />
                ))}
            </div>
        </section>
    );
}
