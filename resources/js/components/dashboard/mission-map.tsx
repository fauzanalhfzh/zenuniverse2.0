import { Link } from '@inertiajs/react';
import {
    Check,
    ChevronLeft,
    ChevronRight,
    Flag,
    LockKeyhole,
    Star,
} from 'lucide-react';
import { useRef } from 'react';
import { show as lessonShow } from '@/routes/lesson';
import type { CourseDetail } from '@/types/lesson';
import './mission-map.css';

const positions = [
    [86, 76],
    [230, 104],
    [374, 72],
    [517, 103],
    [602, 250],
    [566, 378],
    [423, 420],
    [278, 376],
    [130, 423],
    [193, 535],
];
const paths = [
    'M86 76 C140 76 176 104 230 104',
    'M230 104 C280 104 323 72 374 72',
    'M374 72 C424 72 468 103 517 103',
    'M517 103 C582 103 602 162 602 250',
    'M602 250 C612 308 612 348 566 378',
    'M566 378 C520 400 476 420 423 420',
    'M423 420 C369 420 333 376 278 376',
    'M278 376 C220 376 170 388 130 423',
    'M130 423 C79 485 138 526 193 535',
];

export default function MissionMap({ course }: { course: CourseDetail }) {
    const track = useRef<HTMLDivElement>(null);
    const allLessons = course.units.flatMap((unit) => unit.lessons);
    const pages = Array.from(
        { length: Math.ceil(allLessons.length / positions.length) },
        (_, part) =>
            allLessons.slice(
                part * positions.length,
                (part + 1) * positions.length,
            ),
    );
    const activeId = allLessons.find(
        (lesson) => lesson.unlocked && !lesson.completed,
    )?.id;

    function move(direction: number) {
        const element = track.current;
        if (!element) return;
        const panel = element.querySelector<HTMLElement>('.mission-panel');
        element.scrollBy({
            left:
                direction * ((panel?.offsetWidth ?? element.clientWidth) + 20),
        });
    }

    return (
        <section
            className="mission-map"
            aria-label={`Peta misi ${course.title}`}
        >
            <div
                className="mission-track"
                ref={track}
                tabIndex={0}
                aria-label="Geser horizontal untuk melihat bagian lainnya"
            >
                {pages.map((lessons, pageIndex) => {
                    const completed = lessons.filter(
                        (lesson) => lesson.completed,
                    ).length;
                    const current = lessons.find(
                        (lesson) => lesson.id === activeId,
                    );
                    const currentIndex = lessons.findIndex(
                        (lesson) => lesson.id === activeId,
                    );
                    return (
                        <article className="mission-panel" key={lessons[0].id}>
                            <header className="mission-header">
                                <div>
                                    <p className="mission-eyebrow">
                                        Bagian {pageIndex + 1} dari{' '}
                                        {pages.length}
                                    </p>
                                    <h2 className="font-display">
                                        {course.title}
                                    </h2>
                                    <div className="mission-completion">
                                        <progress
                                            value={completed}
                                            max={lessons.length || 1}
                                            aria-label={`Progres ${course.title}`}
                                        />
                                        <span>
                                            {completed} dari {lessons.length}{' '}
                                            selesai
                                        </span>
                                    </div>
                                </div>
                                <svg
                                    aria-hidden="true"
                                    className="mission-planet"
                                    viewBox="0 0 100 90"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="5"
                                >
                                    <circle cx="50" cy="45" r="31" />
                                    <ellipse
                                        cx="50"
                                        cy="45"
                                        rx="46"
                                        ry="14"
                                        transform="rotate(-35 50 45)"
                                    />
                                </svg>
                            </header>
                            <div className="mission-space">
                                <svg
                                    className="mission-paths"
                                    viewBox="0 0 760 640"
                                    preserveAspectRatio="none"
                                    aria-hidden="true"
                                >
                                    {paths
                                        .slice(
                                            0,
                                            Math.max(0, lessons.length - 1),
                                        )
                                        .map((path, index) => (
                                            <path
                                                key={path}
                                                d={path}
                                                fill="none"
                                                stroke={
                                                    lessons[index + 1].completed
                                                        ? '#83d5b5'
                                                        : lessons[index + 1]
                                                                .id === activeId
                                                          ? '#ffb366'
                                                          : '#7586aa'
                                                }
                                                strokeWidth="3"
                                                vectorEffect="non-scaling-stroke"
                                            />
                                        ))}
                                    {lessons.length > 0 && (
                                        <path
                                            d={`M${positions[lessons.length - 1][0]} ${positions[lessons.length - 1][1]} C440 560 486 540 548 540`}
                                            fill="none"
                                            stroke="#7586aa"
                                            strokeWidth="3"
                                            vectorEffect="non-scaling-stroke"
                                        />
                                    )}
                                </svg>
                                <ol className="mission-nodes">
                                    {lessons.map((lesson, index) => {
                                        const isActive = lesson.id === activeId;
                                        const state = lesson.completed
                                            ? 'done'
                                            : isActive
                                              ? 'active'
                                              : lesson.unlocked
                                                ? 'available'
                                                : 'locked';
                                        const Icon = lesson.completed
                                            ? Check
                                            : lesson.unlocked
                                              ? Star
                                              : LockKeyhole;
                                        const label = `${String(pageIndex * positions.length + index + 1).padStart(2, '0')}${lesson.completed ? ' · Selesai' : isActive ? ' · Siap dimulai' : ''}`;
                                        return (
                                            <li
                                                key={lesson.id}
                                                className={`mission-stop is-${state}`}
                                                style={{
                                                    left: `${positions[index][0] / 7.6}%`,
                                                    top: `${positions[index][1] / 6.4}%`,
                                                }}
                                            >
                                                {isActive && (
                                                    <span className="mission-you">
                                                        Kamu di sini
                                                    </span>
                                                )}
                                                {lesson.unlocked ? (
                                                    <Link
                                                        href={lessonShow.url(
                                                            lesson.id,
                                                        )}
                                                        className="mission-node"
                                                        aria-label={`${lesson.title}, ${lesson.completed ? 'selesai, ulangi misi' : 'mulai misi'}`}
                                                        aria-current={
                                                            isActive
                                                                ? 'step'
                                                                : undefined
                                                        }
                                                    >
                                                        <Icon aria-hidden="true" />
                                                    </Link>
                                                ) : (
                                                    <span
                                                        className="mission-node"
                                                        role="img"
                                                        aria-label={`${lesson.title}, terkunci`}
                                                    >
                                                        <Icon aria-hidden="true" />
                                                    </span>
                                                )}
                                                <span className="mission-node-label">
                                                    {label}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ol>
                                {current ? (
                                    <div className="mission-briefing">
                                        <div>
                                            <p className="mission-eyebrow">
                                                Misi aktif
                                            </p>
                                            <h3 className="font-display">
                                                {current.title}
                                            </h3>
                                            <p className="mission-description">
                                                {current.description ||
                                                    'Lanjutkan perjalanan coding-mu.'}
                                            </p>
                                        </div>
                                        <Link
                                            className="mission-start"
                                            href={lessonShow.url(current.id)}
                                        >
                                            Mulai misi{' '}
                                            <ChevronRight
                                                size={14}
                                                aria-hidden="true"
                                            />
                                        </Link>
                                    </div>
                                ) : null}
                                {currentIndex === 4 && (
                                    <span
                                        className="mission-briefing-line"
                                        aria-hidden="true"
                                    />
                                )}
                                <div className="mission-finish">
                                    <span className="mission-finish-icon">
                                        <Flag aria-hidden="true" />
                                    </span>
                                    <span>
                                        {completed === lessons.length &&
                                        completed > 0
                                            ? 'Bagian selesai'
                                            : 'Target bagian'}
                                    </span>
                                    <small>Selesaikan semua misi</small>
                                </div>
                                <div className="mission-paging">
                                    <button
                                        type="button"
                                        onClick={() => move(-1)}
                                        disabled={pageIndex === 0}
                                        aria-label="Bagian sebelumnya"
                                    >
                                        <ChevronLeft aria-hidden="true" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => move(1)}
                                        disabled={
                                            pageIndex === pages.length - 1
                                        }
                                        aria-label="Bagian berikutnya"
                                    >
                                        <ChevronRight aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                            <footer className="mission-legend">
                                <span>
                                    <Check aria-hidden="true" /> Selesai
                                </span>
                                <span>
                                    <Star aria-hidden="true" /> Misi aktif
                                </span>
                                <span>
                                    <LockKeyhole aria-hidden="true" /> Terkunci
                                </span>
                                <span className="mission-unit-count">
                                    Misi {pageIndex * positions.length + 1}–
                                    {pageIndex * positions.length +
                                        lessons.length}
                                </span>
                            </footer>
                        </article>
                    );
                })}
                {pages.length === 0 && (
                    <p className="p-6">Belum ada misi di kursus ini.</p>
                )}
            </div>
        </section>
    );
}
