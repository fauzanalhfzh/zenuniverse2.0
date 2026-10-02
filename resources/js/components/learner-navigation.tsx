import { Link } from '@inertiajs/react';
import { LogOut } from 'lucide-react';
import { dashboard, home, leaderboard, logout } from '@/routes';
import { index as learnIndex } from '@/routes/learn';
import { show as profileShow } from '@/routes/profile';
import './dashboard/mission-map.css';

type NavigationKey = 'courses' | 'missions' | 'leaderboard' | 'profile';

const navigation = [
    {
        key: 'missions',
        label: 'Peta',
        mobileLabel: 'Peta',
        href: dashboard.url(),
        icon: 'map',
    },
    {
        key: 'courses',
        label: 'Modul',
        mobileLabel: 'Modul',
        href: learnIndex.url(),
        icon: 'module',
    },
    {
        key: 'leaderboard',
        label: 'Papan skor',
        mobileLabel: 'Papan skor',
        href: leaderboard.url(),
        icon: 'leaderboard',
    },
    {
        key: 'profile',
        label: 'Profil',
        mobileLabel: 'Profil',
        href: profileShow.url(),
        icon: 'profile',
    },
] satisfies Array<{
    key: NavigationKey;
    label: string;
    mobileLabel: string;
    href: string;
    icon: string;
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
                        <span>Zenuniverse</span>
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
                                    <img
                                        src={`/images/dashboard-sidebar/${Icon}.png`}
                                        alt=""
                                        className="dashboard-navigation-icon"
                                    />
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
                            aria-label={item.mobileLabel}
                            aria-current={
                                item.key === active ? 'page' : undefined
                            }
                        >
                            <img
                                src={`/images/dashboard-sidebar/${Icon}.png`}
                                alt=""
                                className="dashboard-navigation-icon"
                            />
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
