import { Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { useLessonNavigationLoading } from '@/components/lesson/lesson-navigation-loading';
import { useSubscription } from '@/lib/subscription/session';
import { show as lessonShow } from '@/routes/lesson';
import type { CourseDetail } from '@/types/lesson';
import './mission-map.css';

const nodeX = [39, 54, 63, 55, 46, 38];
const missionIcons = ['Book', 'Quiz', 'Book', 'Code', 'Quiz', 'Quiz'];
const stepY = 106;

export default function MissionMap({ course }: { course: CourseDetail }) {
    const subscription = useSubscription();
    const plusLocked = course.accessTier === 'plus' && !subscription.plusActive;
    const viewport = useRef<HTMLDivElement>(null);
    const [poppingId, setPoppingId] = useState<string | null>(null);
    const [previewId, setPreviewId] = useState<string | null>(null);

    function placePreview(card: HTMLElement, node: HTMLElement) {
        const bounds = node.getBoundingClientRect();
        const width = card.offsetWidth;
        const height = card.offsetHeight;
        const gap = 12;
        const above = bounds.bottom + gap + height > window.innerHeight - gap;
        card.style.left = `${Math.max(gap, Math.min(bounds.left + bounds.width / 2 - width / 2, window.innerWidth - width - gap))}px`;
        card.style.top = `${Math.max(gap, Math.min(above ? bounds.top - height - gap : bounds.bottom + gap, window.innerHeight - height - gap))}px`;
        card.dataset.side = above ? 'above' : 'below';
    }

    useEffect(() => {
        if (!previewId) return;
        const card = document.getElementById(`mission-preview-${previewId}`);
        const node = document.getElementById(`mission-node-${previewId}`);
        if (!card || !node) return;
        const reposition = () => placePreview(card, node);
        window.addEventListener('resize', reposition);
        window.addEventListener('scroll', reposition, true);
        return () => {
            window.removeEventListener('resize', reposition);
            window.removeEventListener('scroll', reposition, true);
        };
    }, [previewId]);
    const loading = useLessonNavigationLoading();
    const [navigationError, setNavigationError] = useState<string | null>(null);
    const cancelToken = useRef<{ cancel: () => void } | null>(null);
    const returnFocus = useRef<HTMLElement | null>(null);
    const lessons = course.units.flatMap((unit) => unit.lessons);
    const activeId = lessons.find(
        (lesson) => lesson.unlocked && !lesson.completed,
    )?.id;
    const activeIndex = lessons.findIndex((lesson) => lesson.id === activeId);
    const currentIndex =
        activeIndex >= 0 ? activeIndex : Math.max(lessons.length - 1, 0);
    const currentLesson = lessons[currentIndex];
    const activeUnitIndex = Math.max(
        0,
        course.units.findIndex((unit) =>
            unit.lessons.some((lesson) => lesson.id === currentLesson?.id),
        ),
    );
    const [visibleUnitIndex, setVisibleUnitIndex] = useState<number | null>(
        null,
    );
    const displayedUnitIndex = visibleUnitIndex ?? activeUnitIndex;
    const displayedUnit = course.units[displayedUnitIndex];

    function updateVisibleUnit(container: HTMLDivElement) {
        const middle =
            container.getBoundingClientRect().top + container.clientHeight / 2;
        let closestIndex = currentIndex;
        let closestDistance = Infinity;

        container
            .querySelectorAll<HTMLElement>('[data-lesson-index]')
            .forEach((node) => {
                const bounds = node.getBoundingClientRect();
                const distance = Math.abs(
                    bounds.top + bounds.height / 2 - middle,
                );
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = Number(node.dataset.lessonIndex);
                }
            });

        const unitIndex = course.units.findIndex((unit) =>
            unit.lessons.some(
                (lesson) => lesson.id === lessons[closestIndex]?.id,
            ),
        );
        setVisibleUnitIndex(Math.max(0, unitIndex));
    }

    function openLesson(
        event: MouseEvent,
        lesson: CourseDetail['units'][number]['lessons'][number],
    ) {
        if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
        ) {
            return;
        }

        event.preventDefault();
        if (cancelToken.current) return;
        returnFocus.current = document.getElementById(
            `mission-node-${lesson.id}`,
        );
        document.getElementById(`mission-preview-${lesson.id}`)?.hidePopover();
        router.visit(lessonShow.url(lesson.id), {
            onCancelToken: (token) => {
                cancelToken.current = token;
            },
            onStart: () => {
                setPoppingId(lesson.id);
                setNavigationError(null);
                loading.start({
                    onCancel: () => cancelToken.current?.cancel(),
                    returnFocus,
                });
            },
            onNetworkError: () => {
                setNavigationError(
                    'Koneksi bermasalah. Tekan misi lagi untuk mencoba.',
                );
                return false;
            },
            onError: () => {
                setNavigationError(
                    'Pelajaran belum bisa dimuat. Tekan misi lagi untuk mencoba.',
                );
            },
            onCancel: () => loading.finish(true),
            onFinish: () => {
                cancelToken.current = null;
                loading.finish();
                setPoppingId(null);
            },
        });
    }

    useEffect(() => {
        if (currentIndex < 0 || !viewport.current) return;
        const currentNode = viewport.current.querySelector<HTMLElement>(
            `[data-lesson-index="${currentIndex}"]`,
        );
        if (!currentNode) return;
        viewport.current.scrollTop = Math.max(
            currentNode.offsetTop -
                (viewport.current.clientHeight - currentNode.offsetHeight) / 2,
            0,
        );
    }, [currentIndex]);

    return (
        <section
            className="mission-map"
            aria-label={`Peta misi ${course.title}`}
        >
            <header className="mission-header">
                <div className="mission-header-copy">
                    <div className="mission-eyebrow">
                        <span>
                            Bagian {displayedUnitIndex + 1}, Unit{' '}
                            {displayedUnitIndex + 1}
                        </span>
                    </div>
                    <h1 className="font-display">
                        {displayedUnit?.title ?? course.title}
                    </h1>
                </div>
            </header>

            {course.accessTier === 'plus' ? (
                <div className="px-4 py-3 text-sm">
                    <p role="status">
                        {subscription.status === 'loading'
                            ? 'Memeriksa akses Plus...'
                            : subscription.status === 'error'
                              ? 'Status Plus belum bisa diperiksa. Hubungkan internet lalu coba lagi.'
                              : subscription.plusActive
                                ? 'Plus aktif. Nyawa tanpa batas dan akses pelajaran Plus.'
                                : 'Pelajaran ini memerlukan Plus. Plus memberi akses pelajaran Plus dan nyawa tanpa batas. Pembelian belum tersedia.'}
                    </p>
                    <button
                        type="button"
                        className="mission-start mt-2 min-h-11"
                        disabled={subscription.status === 'loading'}
                        onClick={() => void subscription.refresh()}
                    >
                        {subscription.status === 'error'
                            ? 'Coba periksa lagi'
                            : 'Perbarui status Plus'}
                    </button>
                </div>
            ) : null}

            <div className="mission-section-divider" aria-hidden="true">
                <span>{displayedUnit?.title ?? course.title}</span>
            </div>

            {navigationError ? (
                <p
                    role="alert"
                    className="px-4 py-3 text-sm font-semibold text-[#a6400a]"
                >
                    {navigationError}
                </p>
            ) : null}

            <div
                className="mission-viewport"
                ref={viewport}
                onScroll={(event) => updateVisibleUnit(event.currentTarget)}
            >
                {lessons.length > 0 ? (
                    <div
                        className="mission-journey"
                        style={{ height: `${lessons.length * stepY + 54}px` }}
                    >
                        <ol className="mission-nodes">
                            {lessons.map((lesson, index) => {
                                const isActive = lesson.id === activeId;
                                const state = plusLocked
                                    ? 'locked'
                                    : lesson.completed
                                      ? 'done'
                                      : isActive
                                        ? 'active'
                                        : lesson.unlocked
                                          ? 'available'
                                          : 'locked';
                                const icon =
                                    missionIcons[index % missionIcons.length];

                                return (
                                    <li
                                        key={lesson.id}
                                        data-lesson-index={index}
                                        className={`mission-stop is-${state}`}
                                        style={{
                                            left: `${nodeX[index % nodeX.length]}%`,
                                            top: `${12 + index * stepY}px`,
                                        }}
                                    >
                                        <button
                                            type="button"
                                            id={`mission-node-${lesson.id}`}
                                            className={`mission-node${poppingId === lesson.id ? ' is-popping' : ''}`}
                                            popoverTarget={`mission-preview-${lesson.id}`}
                                            aria-controls={`mission-preview-${lesson.id}`}
                                            aria-expanded={
                                                previewId === lesson.id
                                            }
                                            aria-label={`${lesson.title}, ${state === 'locked' ? 'terkunci' : lesson.completed ? 'selesai, ulangi misi' : 'mulai misi'}`}
                                            aria-current={
                                                isActive ? 'step' : undefined
                                            }
                                            onAnimationEnd={() =>
                                                setPoppingId(null)
                                            }
                                        >
                                            <img
                                                src={`/images/path-node/${icon}.png`}
                                                alt=""
                                            />
                                        </button>
                                        <div
                                            id={`mission-preview-${lesson.id}`}
                                            popover="auto"
                                            role="dialog"
                                            aria-labelledby={`mission-title-${lesson.id}`}
                                            className="mission-preview"
                                            onToggle={(event) => {
                                                if (event.newState === 'open') {
                                                    const node =
                                                        document.getElementById(
                                                            `mission-node-${lesson.id}`,
                                                        );
                                                    if (node)
                                                        placePreview(
                                                            event.currentTarget,
                                                            node,
                                                        );
                                                    setPreviewId(lesson.id);
                                                } else {
                                                    setPreviewId((current) =>
                                                        current === lesson.id
                                                            ? null
                                                            : current,
                                                    );
                                                }
                                            }}
                                        >
                                            <button
                                                type="button"
                                                className="mission-preview-close"
                                                aria-label="Tutup pratinjau pelajaran"
                                                popoverTarget={`mission-preview-${lesson.id}`}
                                                popoverTargetAction="hide"
                                                onClick={() =>
                                                    document
                                                        .getElementById(
                                                            `mission-node-${lesson.id}`,
                                                        )
                                                        ?.focus()
                                                }
                                            >
                                                ×
                                            </button>
                                            <h2
                                                id={`mission-title-${lesson.id}`}
                                            >
                                                {lesson.title}
                                            </h2>
                                            {state === 'locked' ? (
                                                <p className="mission-preview-prerequisite">
                                                    {plusLocked
                                                        ? 'Pelajaran ini memerlukan Plus aktif.'
                                                        : `Selesaikan ${lessons[index - 1]?.title ?? 'pelajaran sebelumnya'} terlebih dahulu untuk membuka pelajaran ini.`}
                                                </p>
                                            ) : (
                                                <Link
                                                    href={lessonShow.url(
                                                        lesson.id,
                                                    )}
                                                    className="mission-start"
                                                    onClick={(event) =>
                                                        openLesson(
                                                            event,
                                                            lesson,
                                                        )
                                                    }
                                                >
                                                    {lesson.completed
                                                        ? 'Ulangi pelajaran'
                                                        : 'Mulai pelajaran'}
                                                </Link>
                                            )}
                                        </div>
                                        <span className="mission-node-label">
                                            Pelajaran{' '}
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                    </li>
                                );
                            })}
                        </ol>
                    </div>
                ) : (
                    <p className="mission-empty">
                        Belum ada misi di kursus ini.
                    </p>
                )}
            </div>
        </section>
    );
}
