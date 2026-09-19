import { ChevronLeft, ChevronRight, Crown, Medal, Trophy } from 'lucide-react';
import { AvatarImage } from '@/components/profile/avatar-image';
import { Button } from '@/components/ui/button';
import type { LeaderboardEntry, LeaderboardProps } from '@/types/profile';

function rankBadge(rank: number) {
    if (rank === 1) {
        return <Crown className="size-5 text-amber-500" aria-hidden="true" />;
    }

    if (rank === 2) {
        return <Medal className="size-5 text-slate-400" aria-hidden="true" />;
    }

    if (rank === 3) {
        return <Medal className="size-5 text-amber-700" aria-hidden="true" />;
    }

    return <span className="text-slate-500">#{rank}</span>;
}

export function LeaderboardView({ board }: { board: LeaderboardProps }) {
    const hasPrevious = board.page > 1;
    const hasNext = board.page < board.totalPages;

    return (
        <div className="mx-auto w-full max-w-2xl min-w-0 space-y-5 sm:space-y-6">
            <div className="text-center">
                <h1 className="font-display text-2xl font-bold text-slate-800 sm:text-3xl">
                    Papan Peringkat
                </h1>
                <p className="mt-2 text-sm leading-relaxed font-semibold text-slate-600">
                    Bersaing dengan teman dan naik peringkat dengan mengumpulkan
                    XP.
                </p>
            </div>

            <div className="rounded-2xl border-2 border-slate-100 bg-gradient-to-br from-amber-400 to-orange-500 text-amber-950 shadow-[0_6px_0_rgba(217,119,6,0.25)]">
                <div className="flex items-center justify-between gap-3 p-4 sm:p-5">
                    <div className="min-w-0">
                        <p className="text-xs font-bold">POSISIMU</p>
                        <p className="font-display mt-1 text-xl leading-tight font-bold sm:text-2xl">
                            {board.viewerRank === null
                                ? 'Belum terdaftar'
                                : `Peringkat #${board.viewerRank}`}
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                            {board.totalParticipants} peserta terdaftar
                        </p>
                    </div>
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/20 sm:size-14 sm:rounded-2xl">
                        <Trophy
                            className="size-6 sm:size-7"
                            aria-hidden="true"
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border-2 border-slate-100 bg-white">
                <div className="flex items-center gap-2 border-b-2 border-slate-100 px-4 py-4 sm:px-5">
                    <Crown
                        className="size-5 text-amber-500"
                        aria-hidden="true"
                    />
                    <h2 className="font-display text-lg font-bold text-slate-800">
                        Peringkat peserta
                    </h2>
                </div>

                {board.entries.length === 0 ? (
                    <p className="p-8 text-center text-sm font-semibold text-slate-500">
                        Belum ada peserta di papan peringkat.
                    </p>
                ) : (
                    <ul className="flex flex-col gap-2 p-2 sm:p-4">
                        {board.entries.map((entry: LeaderboardEntry) => (
                            <li
                                key={entry.userId}
                                className={`grid min-w-0 grid-cols-[2rem_2.5rem_minmax(0,1fr)] items-center gap-x-2 gap-y-1 rounded-2xl border-2 p-2.5 sm:grid-cols-[2rem_2.5rem_minmax(0,1fr)_auto] sm:gap-x-3 sm:p-3 ${
                                    entry.isViewer
                                        ? 'border-primary bg-orange-50'
                                        : 'border-slate-100 bg-white'
                                }`}
                            >
                                <div
                                    className="row-span-2 flex min-h-8 min-w-0 items-center justify-center text-xs font-bold tabular-nums sm:row-span-1"
                                    aria-label={`Peringkat ${entry.rank}`}
                                >
                                    {rankBadge(entry.rank)}
                                </div>
                                <AvatarImage
                                    src={entry.avatarUrl}
                                    displayName={entry.displayName}
                                    className="row-span-2 size-10 rounded-full sm:row-span-1"
                                />
                                <div className="min-w-0">
                                    <p
                                        className={`text-sm leading-snug font-bold sm:text-base ${
                                            entry.isViewer
                                                ? 'text-orange-900'
                                                : 'text-slate-800'
                                        }`}
                                    >
                                        {entry.displayName}{' '}
                                        {entry.isViewer && '(Kamu)'}
                                    </p>
                                </div>
                                <span className="col-start-3 max-w-full justify-self-start rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 tabular-nums sm:col-start-auto sm:px-3">
                                    {entry.totalXp} XP
                                </span>
                            </li>
                        ))}
                    </ul>
                )}

                <nav
                    aria-label="Halaman papan peringkat"
                    className="grid grid-cols-2 items-center gap-3 border-t-2 border-slate-100 px-3 pt-3 pb-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:px-4"
                >
                    <p className="col-span-2 text-center text-xs font-bold text-slate-600 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                        Halaman {board.page} dari {board.totalPages}
                    </p>
                    {hasPrevious ? (
                        <Button
                            href={`?page=${board.page - 1}`}
                            variant="outline"
                            size="sm"
                            className="min-h-11 min-w-0 gap-1 rounded-xl px-2 whitespace-normal sm:col-start-1 sm:row-start-1 sm:px-4"
                        >
                            <ChevronLeft
                                className="size-4"
                                aria-hidden="true"
                            />
                            Sebelumnya
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="min-h-11 min-w-0 gap-1 rounded-xl px-2 whitespace-normal sm:col-start-1 sm:row-start-1 sm:px-4"
                        >
                            <ChevronLeft
                                className="size-4"
                                aria-hidden="true"
                            />
                            Sebelumnya
                        </Button>
                    )}
                    {hasNext ? (
                        <Button
                            href={`?page=${board.page + 1}`}
                            variant="outline"
                            size="sm"
                            className="min-h-11 min-w-0 gap-1 rounded-xl px-2 whitespace-normal sm:col-start-3 sm:row-start-1 sm:px-4"
                        >
                            Berikutnya
                            <ChevronRight
                                className="size-4"
                                aria-hidden="true"
                            />
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="min-h-11 min-w-0 gap-1 rounded-xl px-2 whitespace-normal sm:col-start-3 sm:row-start-1 sm:px-4"
                        >
                            Berikutnya
                            <ChevronRight
                                className="size-4"
                                aria-hidden="true"
                            />
                        </Button>
                    )}
                </nav>
            </div>

            {board.totalPages > 1 ? (
                <p className="text-center text-xs font-semibold text-slate-400">
                    {board.totalParticipants} peserta.
                </p>
            ) : null}
        </div>
    );
}
