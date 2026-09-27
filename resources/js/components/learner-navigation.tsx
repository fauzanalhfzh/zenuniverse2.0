import { Link } from '@inertiajs/react';
import { BookCopy, BookOpen, LogOut, Trophy, UserRound } from 'lucide-react';
import { dashboard, home, leaderboard, logout } from '@/routes';
import { index as learnIndex } from '@/routes/learn';
import { show as profileShow } from '@/routes/profile';
import './dashboard/mission-map.css';

type NavigationKey = 'courses' | 'missions' | 'leaderboard' | 'profile';

const navigation = [
    {
        key: 'courses',
        label: 'Ganti modul',
        mobileLabel: 'Modul',
        href: learnIndex.url(),
        icon: BookCopy,
    },
    {
        key: 'missions',
        label: 'Peta misi',
        mobileLabel: 'Peta misi',
        href: dashboard.url(),
        icon: BookOpen,
    },
    {
        key: 'leaderboard',
        label: 'Papan skor',
        mobileLabel: 'Papan skor',
        href: leaderboard.url(),
        icon: Trophy,
    },
    {
        key: 'profile',
        label: 'Profil penjelajah',
        mobileLabel: 'Profil',
        href: profileShow.url(),
        icon: UserRound,
    },
] satisfies Array<{
    key: NavigationKey;
    label: string;
    mobileLabel: string;
    href: string;
    icon: typeof BookOpen;
}>;

export default function LearnerNavigation({
    active,
}: {
    active: NavigationKey;
}) {
    const items = navigation;
    return (
        <>
            <aside className="dashboard-sidebar">
                <div>
                    <Link
                        href={home.url()}
                        className="dashboard-brand"
                        aria-label="ZenUniverse, beranda"
                    >
                        <img src="/logo.jpeg" alt="" />
                        <span>ZenUniverse</span>
                    </Link>
                    <nav aria-label="Navigasi utama" className="dashboard-nav">
                        {items.map((item) => {
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    aria-current={
                                        item.key === active ? 'page' : undefined
                                    }
                                >
                                    <Icon aria-hidden="true" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="dashboard-sidebar-actions">
                    <Link
                        href={logout.url()}
                        method="post"
                        as="button"
                        className="dashboard-logout"
                    >
                        <LogOut aria-hidden="true" />
                        <span>Keluar</span>
                    </Link>
                </div>
            </aside>

            <nav className="dashboard-bottom-nav" aria-label="Navigasi utama">
                {items.map((item) => {
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            aria-current={
                                item.key === active ? 'page' : undefined
                            }
                        >
                            <Icon aria-hidden="true" />
                            <span>{item.mobileLabel}</span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
