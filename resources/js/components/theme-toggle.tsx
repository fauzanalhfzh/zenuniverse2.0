import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

const storageKey = 'zenuniverse-theme';

export function ThemeToggle() {
    const [dark, setDark] = useState(false);

    useEffect(() => {
        const savedTheme = window.localStorage.getItem(storageKey);
        const enabled = savedTheme === 'dark';

        document.documentElement.classList.toggle('dark', enabled);
        setDark(enabled);
    }, []);

    function toggleTheme() {
        const nextTheme = !dark;

        document.documentElement.classList.toggle('dark', nextTheme);
        window.localStorage.setItem(storageKey, nextTheme ? 'dark' : 'light');
        setDark(nextTheme);
    }

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={dark ? 'Gunakan mode terang' : 'Gunakan mode gelap'}
            title={dark ? 'Gunakan mode terang' : 'Gunakan mode gelap'}
            className="inline-flex size-11 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#475569] transition-colors hover:border-[#ff8a3d] hover:text-[#ea6a12] focus-visible:ring-[3px] focus-visible:ring-[#4338ca] focus-visible:outline-none dark:border-[#334563] dark:bg-[#162440] dark:text-[#f4f6ff] dark:hover:border-[#ff8a3d] dark:hover:text-[#ff8a3d]"
        >
            {dark ? (
                <Sun className="size-5" aria-hidden="true" />
            ) : (
                <Moon className="size-5" aria-hidden="true" />
            )}
        </button>
    );
}
