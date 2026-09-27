import { Link } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { show as lessonShow } from '@/routes/lesson';
import type { CourseDetail } from '@/types/lesson';
import './mission-map.css';

const nodeX = [39, 54, 63, 55, 46, 38];
const missionIcons = ['Materi', 'Kuis', 'Materi', 'Code', 'Kuis', 'Kuis'];
const stepY = 106;

export default function MissionMap({ course }: { course: CourseDetail }) {
    const viewport = useRef<HTMLDivElement>(null);
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
    const activeUnit = course.units[activeUnitIndex];

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
                            Bagian {activeUnitIndex + 1}, Unit{' '}
                            {activeUnitIndex + 1}
                        </span>
                    </div>
                    <h1 className="font-display">
                        {activeUnit?.title ?? course.title}
                    </h1>
                </div>
            </header>

            <div className="mission-section-divider" aria-hidden="true">
                <span>{activeUnit?.title ?? course.title}</span>
            </div>

            <div className="mission-viewport" ref={viewport}>
                {lessons.length > 0 ? (
                    <div
                        className="mission-journey"
                        style={{ height: `${lessons.length * stepY + 54}px` }}
                    >
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
                                        {lesson.unlocked ? (
                                            <Link
                                                href={lessonShow.url(lesson.id)}
                                                className="mission-node"
                                                aria-label={`${lesson.title}, ${lesson.completed ? 'selesai, ulangi misi' : 'mulai misi'}`}
                                                aria-current={
                                                    isActive
                                                        ? 'step'
                                                        : undefined
                                                }
                                            >
                                                <img
                                                    src={`/images/path-node/${icon}.png`}
                                                    alt=""
                                                />
                                            </Link>
                                        ) : (
                                            <span
                                                className="mission-node"
                                                role="img"
                                                aria-label={`${lesson.title}, terkunci`}
                                            >
                                                <img
                                                    src={`/images/path-node/${icon}.png`}
                                                    alt=""
                                                />
                                            </span>
                                        )}
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
