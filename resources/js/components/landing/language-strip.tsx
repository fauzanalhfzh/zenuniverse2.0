const languages = [
    { label: 'Codeblock', src: '/images/course-icon/code-block.png' },
    { label: 'Python', src: '/images/course-icon/python.png' },
    { label: 'JavaScript', src: '/images/course-icon/javascript.png' },
    { label: 'C++', src: '/images/course-icon/cpp.png' },
    { label: 'CSS', src: '/images/course-icon/css.png' },
    { label: 'HTML', src: '/images/course-icon/html.png' },
] as const;

function LanguageItem({ label, src }: { label: string; src: string }) {
    return (
        <span className="flex shrink-0 items-center gap-2.5 whitespace-nowrap">
            <img
                src={src}
                alt=""
                width={32}
                height={32}
                className="size-8 object-contain"
            />
            <span className="text-[16px] font-bold text-[#475569] dark:text-[#afc1dc]">
                {label}
            </span>
        </span>
    );
}

export function LanguageStrip() {
    return (
        <section
            aria-label="Bahasa pemrograman"
            className="language-strip relative border-y-2 border-[#e2e8f0] bg-white dark:border-[#334563] dark:bg-[#162440]"
        >
            <label className="absolute top-1/2 right-3 z-10 flex -translate-y-1/2 cursor-pointer items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white p-2 text-xs font-bold text-[#475569] motion-reduce:hidden dark:border-[#334563] dark:bg-[#0e1931] dark:text-[#afc1dc]">
                <input type="checkbox" className="size-4 accent-[#ff8a3d]" />
                Jeda animasi
            </label>
            <div className="mx-auto flex w-full max-w-[1200px] overflow-hidden py-5">
                {[false, true].map((duplicate) => (
                    <div
                        key={String(duplicate)}
                        aria-hidden={duplicate || undefined}
                        className="language-strip-group flex min-w-full shrink-0 items-center justify-around gap-7 px-3.5 motion-reduce:w-full motion-reduce:min-w-0 motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-4 motion-reduce:aria-hidden:hidden"
                    >
                        <LanguageItem
                            label={languages[0].label}
                            src={languages[0].src}
                        />
                        {languages.slice(1).map((language) => (
                            <LanguageItem
                                key={language.label}
                                label={language.label}
                                src={language.src}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </section>
    );
}
