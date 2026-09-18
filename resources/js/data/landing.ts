export interface Feature {
    title: string;
    description: string;
    image?: string;
    imageAlt?: string;
}

export interface BlogPost {
    date: string;
    title: string;
    description: string;
    author: string;
    initial: string;
    thumbClass: string;
}

export interface Course {
    id: string;
    label: string;
    description: string;
    icon: 'Blocks' | 'Code2' | 'FileCode2';
    href: string;
    color: 'explorer' | 'cadet' | 'gold';
}

export interface ValueProp {
    title: string;
    description: string;
    icon: 'Gift' | 'Gamepad2' | 'Trophy';
    color: 'explorer' | 'primary' | 'gold';
}

export const navLinks = [
    { label: 'Beranda', href: '/' },
    { label: 'Mulai', href: '/learn' },
];

export const heroBenefits = [
    'Gratis untuk mulai',
    'Belajar sambil bermain',
    'Bisa sambil offline',
];

export const courses: Course[] = [
    {
        id: 'blockly-basics',
        label: 'Code Block',
        description:
            'Susun blok, jalankan robot. Cara paling gampang mulai coding.',
        icon: 'Blocks',
        href: '/learn/blockly-basics',
        color: 'explorer',
    },
    {
        id: 'python-fundamentals',
        label: 'Python',
        description: 'Bahasa yang dipakai di mana-mana. Kamu pasti bisa.',
        icon: 'Code2',
        href: '/learn/python-fundamentals',
        color: 'cadet',
    },
    {
        id: 'javascript-fundamentals',
        label: 'JavaScript',
        description: 'Bikin web interaktif. Logikanya sama kayak Python.',
        icon: 'FileCode2',
        href: '/learn/javascript-fundamentals',
        color: 'gold',
    },
];

export const valueProps: ValueProp[] = [
    {
        title: 'Gratis',
        description:
            'Kamu bisa mulai sekarang, tanpa bayar. Cocok buat semua anak Indonesia.',
        icon: 'Gift',
        color: 'explorer',
    },
    {
        title: 'Seru',
        description:
            'Seret blok, kumpulkan poin, naik level. Kayak main game, bukan belajar.',
        icon: 'Gamepad2',
        color: 'primary',
    },
    {
        title: 'Ampuh',
        description:
            'Metode yang dipakai di banyak tempat belajar coding di dunia. Kamu bakal ngerti.',
        icon: 'Trophy',
        color: 'gold',
    },
];

export const features: Feature[] = [
    {
        title: 'Main Sambil Belajar',
        image: '/images/features/console.png',
        description:
            'Kumpulkan poin energi dan tukarkan dengan kostum astronot yang keren banget!',
    },
    {
        title: 'Naik Level Terus',
        image: '/images/features/level.png',
        description:
            'Mulai dari pemula sampai jadi ahli. Pelan-pelan asal happy, pasti bisa!',
    },
    {
        title: 'Bisa Tanpa Sinyal',
        description:
            'Gak ada internet? Gak masalah! Download misinya dan mainkan di mana saja',
        image: '/images/features/satelit.png',
        imageAlt: 'Satelit',
    },
];

export const blogPosts: BlogPost[] = [
    {
        date: '12 Jan 2026',
        title: 'Rahasia HTML: Tag yang Wajib Kamu Tahu',
        description:
            'Belajar tag HTML dasar dengan cara yang seru dan mudah dipahami.',
        author: 'Ayu Putri',
        initial: 'A',
        thumbClass: 'bg-blue-100',
    },
    {
        date: '12 Jan 2026',
        title: 'Cara Kerja Internet untuk Pemula',
        description:
            'Bagaimana data mengalir dari server ke layarmu setiap detik.',
        author: 'Dimas Anggara',
        initial: 'D',
        thumbClass: 'bg-slate-900',
    },
    {
        date: '12 Jan 2026',
        title: 'Membuat Game Pertamamu di Browser',
        description:
            'Langkah demi langkah membangun game sederhana dengan JavaScript.',
        author: 'Siti Rahma',
        initial: 'S',
        thumbClass: 'bg-green-100',
    },
];

export const aboutParagraphs = [
    'Dulu, di awal masa kuliah, ada satu perasaan yang cukup familiar: bingung mau belajar dari mana, dan sama siapa? Materi sains, coding, dan teknologi tersebar di mana-mana.',
    'Dari kebingungan itulah sebuah pertanyaan kecil muncul. Bukan keluhan, tapi sebuah ide: bagaimana kalau kita buat sendiri ruangnya? Ruang yang hangat dan terbuka.',
    'Dari situ, Zenuniverse lahir. Bukan dari gedung mewah, tapi dari keyakinan sederhana bahwa ilmu lebih bermakna ketika dibagikan - dan bahwa belajar bersama selalu lebih menyenangkan dari belajar sendiri.',
];

export const aboutGallery = [
    { src: '/images/about/banner-2.webp', alt: 'Suasana belajar ZenUniverse' },
    {
        src: '/images/about/banner-1.webp',
        alt: 'Kegiatan komunitas ZenUniverse',
    },
    { src: '/images/about/banner-3.webp', alt: 'Komunitas ZenUniverse' },
];
