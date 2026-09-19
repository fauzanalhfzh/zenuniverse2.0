import { AvatarUploader } from './avatar-uploader';
import type { ProfileProps } from '@/types/profile';

export function ProfileView({ profile }: { profile: ProfileProps }) {
    const joinedYear = profile.joinedAt
        ? new Date(profile.joinedAt).getFullYear()
        : null;

    return (
        <div className="flex flex-col gap-6">
            <section className="overflow-hidden rounded-[2rem] border-4 border-blue-50 bg-white shadow-[0_14px_0_#dbeafe]">
                <div className="flex flex-col items-center gap-5 p-8 pt-6 text-center md:p-10 md:pt-8">
                    <AvatarUploader
                        avatarUrl={profile.avatarUrl}
                        displayName={profile.displayName}
                    />

                    <div>
                        <h1 className="font-display text-3xl font-bold text-slate-800">
                            {profile.displayName}
                        </h1>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                            Level {profile.level.current.name}
                            {joinedYear !== null
                                ? ` · Bergabung ${joinedYear}`
                                : ''}
                        </p>
                    </div>

                    <div className="w-full max-w-md space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold tracking-wider text-slate-500">
                            <span>
                                LEVEL {profile.level.current.level} ·{' '}
                                {profile.level.current.name.toUpperCase()}
                            </span>
                            <span>{profile.level.currentXp} XP</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                            <div
                                className="bg-primary h-full rounded-full"
                                style={{ width: `${profile.level.percent}%` }}
                            />
                        </div>
                        <p className="text-xs font-semibold text-slate-400">
                            {profile.level.xpToNextLevel > 0
                                ? `${profile.level.xpToNextLevel} XP lagi ke level berikutnya`
                                : 'Level maksimal'}
                        </p>
                    </div>

                    <div className="grid w-full max-w-md grid-cols-3 gap-3">
                        <div className="rounded-2xl bg-orange-50 p-4 text-center">
                            <img
                                src="/stats-icon/xp.png"
                                alt=""
                                loading="lazy"
                                className="mx-auto size-8 object-contain"
                            />
                            <p className="font-display mt-1 text-xl font-bold text-slate-800">
                                {profile.gamification.totalXp}
                            </p>
                            <p className="text-[10px] font-bold tracking-wider text-slate-400">
                                TOTAL XP
                            </p>
                        </div>
                        <div className="rounded-2xl bg-red-50 p-4 text-center">
                            <img
                                src="/stats-icon/streak.png"
                                alt=""
                                loading="lazy"
                                className="mx-auto size-8 object-contain"
                            />
                            <p className="font-display mt-1 text-xl font-bold text-slate-800">
                                {profile.gamification.currentStreak}
                            </p>
                            <p className="text-[10px] font-bold tracking-wider text-slate-400">
                                STREAK
                            </p>
                        </div>
                        <div className="rounded-2xl bg-sky-50 p-4 text-center">
                            <img
                                src="/mission-icon/finish-lesson.png"
                                alt=""
                                loading="lazy"
                                className="mx-auto size-8 object-contain"
                            />
                            <p
                                data-testid="completed-lessons"
                                className="font-display mt-1 text-xl font-bold text-slate-800"
                            >
                                {profile.completedLessonCount}/
                                {profile.totalLessonCount}
                            </p>
                            <p className="text-[10px] font-bold tracking-wider text-slate-400">
                                LESSON
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2">
                <section className="rounded-2xl border-2 border-slate-100 bg-white p-5">
                    <h2 className="font-display mb-3 flex items-center gap-2 text-lg font-bold text-slate-800">
                        <img
                            src="/stats-icon/streak.png"
                            alt=""
                            loading="lazy"
                            className="size-6 shrink-0 object-contain"
                        />
                        Streak
                    </h2>
                    <p className="text-3xl font-bold text-slate-800">
                        {profile.gamification.currentStreak} hari
                    </p>
                    <p className="text-sm text-slate-500">
                        Terpanjang: {profile.gamification.longestStreak} hari
                    </p>
                    <div className="mt-4 flex gap-1.5">
                        {Array.from({ length: 7 }).map((_, index) => (
                            <div
                                key={index}
                                className={`h-2 flex-1 rounded-full ${
                                    index < profile.gamification.currentStreak
                                        ? 'bg-orange-500'
                                        : 'bg-slate-200'
                                }`}
                            />
                        ))}
                    </div>
                </section>

                <section className="rounded-2xl border-2 border-slate-100 bg-white p-5">
                    <h2 className="font-display mb-3 flex items-center gap-2 text-lg font-bold text-slate-800">
                        <img
                            src="/mission-icon/mission-xp.png"
                            alt=""
                            loading="lazy"
                            className="size-6 shrink-0 object-contain"
                        />
                        Pencapaian
                    </h2>
                    <p className="text-3xl font-bold text-slate-800">
                        {profile.unlockedBadgeCount}/{profile.badges.length}
                    </p>
                    <p className="text-sm text-slate-500">Badge terbuka</p>
                </section>
            </div>

            <section className="rounded-2xl border-2 border-slate-100 bg-white p-5">
                <h2 className="font-display mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
                    <img
                        src="/mission-icon/mission-xp.png"
                        alt=""
                        loading="lazy"
                        className="size-6 shrink-0 object-contain"
                    />
                    Badge
                </h2>
                <div className="grid gap-3 sm:grid-cols-3">
                    {profile.badges.map((badge) => (
                        <div
                            key={badge.id}
                            className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center ${
                                badge.unlocked
                                    ? 'border-amber-200 bg-amber-50'
                                    : 'border-slate-100 bg-slate-50 opacity-60'
                            }`}
                        >
                            <img
                                src={badge.iconPath}
                                alt=""
                                loading="lazy"
                                className="size-12 shrink-0 object-contain"
                            />
                            <p className="text-sm font-bold text-slate-800">
                                {badge.title}
                            </p>
                            <p className="text-xs text-slate-500">
                                {badge.description}
                            </p>
                            <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                    badge.unlocked
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-slate-200 text-slate-500'
                                }`}
                            >
                                {badge.unlocked ? 'TERBUKA' : 'TERKUNCI'}
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
