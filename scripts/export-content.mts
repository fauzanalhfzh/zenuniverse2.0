import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export type StepType =
    | 'concept'
    | 'quiz'
    | 'blockly'
    | 'code-arrange'
    | 'code-fill'
    | 'code';

export interface ExportedStep {
    id: string;
    type: StepType;
    reward: { xp: number };
    content: Record<string, unknown>;
    validation?: Record<string, unknown>;
    challenge?: Record<string, unknown>;
}

export interface ExportedLesson {
    id: string;
    title: string;
    description: string;
    completionRewardXp: number;
    steps: ExportedStep[];
}

export interface ExportedUnit {
    id: string;
    title: string;
    description: string;
    lessons: ExportedLesson[];
}

export interface ExportedCourse {
    id: string;
    title: string;
    description: string;
    level: string;
    status: 'published' | 'draft';
    plannedLessonIds?: string[];
    units: ExportedUnit[];
}

export interface ContentDump {
    version: 1;
    exportedAt: string;
    source: { path: string; revision: string | null };
    courses: ExportedCourse[];
}

export interface CourseSummary {
    id: string;
    status: 'published' | 'draft';
    units: number;
    lessons: number;
    steps: number;
    checksum: string;
}

export interface ContentMeta {
    version: 1;
    exportedAt: string;
    sourceRevision: string | null;
    contentChecksum: string;
    totals: {
        courses: number;
        published: number;
        draft: number;
        units: number;
        lessons: number;
        steps: number;
    };
    courses: CourseSummary[];
}

const DEFAULT_SOURCE =
    '/home/zen/Documents/Development/zenuniverse-fe/packages/content/src/data/lessons';

const COURSE_MODULES: ReadonlyArray<{
    module: string;
    exportName: string;
    status: 'published' | 'draft';
}> = [
    {
        module: 'blockly-basics/index.ts',
        exportName: 'blocklyBasicsCourse',
        status: 'published',
    },
    {
        module: 'python-fundamentals/index.ts',
        exportName: 'pythonFundamentalsCourse',
        status: 'published',
    },
    {
        module: 'javascript-fundamentals/index.ts',
        exportName: 'javascriptFundamentalsCourse',
        status: 'published',
    },
    {
        module: 'html-fundamentals/index.ts',
        exportName: 'htmlFundamentalsCourse',
        status: 'published',
    },
    {
        module: 'css-fundamentals/index.ts',
        exportName: 'cssFundamentalsCourse',
        status: 'published',
    },
    {
        module: 'cpp-fundamentals/index.ts',
        exportName: 'cppFundamentalsCourse',
        status: 'draft',
    },
];

export function assertUniqueIds(courses: readonly ExportedCourse[]): void {
    const seen = new Set<string>();
    const claim = (id: string, kind: string): void => {
        if (seen.has(id)) {
            throw new Error(`Duplicate content ${kind} id: ${id}`);
        }
        seen.add(id);
    };

    for (const course of courses) {
        claim(course.id, 'course');
        for (const unit of course.units) {
            claim(unit.id, 'unit');
            for (const lesson of unit.lessons) {
                claim(lesson.id, 'lesson');
                for (const step of lesson.steps) {
                    claim(step.id, 'step');
                }
            }
        }
    }
}

export async function loadCourses(
    sourceDir: string,
): Promise<ExportedCourse[]> {
    const courses: ExportedCourse[] = [];

    for (const config of COURSE_MODULES) {
        const modulePath = resolve(sourceDir, config.module);
        const loaded = (await import(pathToFileURL(modulePath).href)) as Record<
            string,
            unknown
        >;
        const course = loaded[config.exportName];

        if (course === null || typeof course !== 'object') {
            throw new Error(
                `Export ${config.exportName} not found in ${modulePath}`,
            );
        }

        courses.push({
            ...(course as Omit<ExportedCourse, 'status'>),
            status: config.status,
        });
    }

    assertUniqueIds(courses);

    return courses;
}

export function buildContentDump(
    courses: readonly ExportedCourse[],
    sourcePath: string,
    revision: string | null,
    exportedAt: string,
): ContentDump {
    return {
        version: 1,
        exportedAt,
        source: { path: sourcePath, revision },
        courses: courses.map((course) => ({ ...course })),
    };
}

function sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
}

export function summarize(dump: ContentDump): ContentMeta {
    const courses: CourseSummary[] = dump.courses.map((course) => {
        const units = course.units.length;
        const lessons = course.units.reduce(
            (total, unit) => total + unit.lessons.length,
            0,
        );
        const steps = course.units.reduce(
            (total, unit) =>
                total +
                unit.lessons.reduce(
                    (lessonTotal, lesson) => lessonTotal + lesson.steps.length,
                    0,
                ),
            0,
        );

        return {
            id: course.id,
            status: course.status,
            units,
            lessons,
            steps,
            checksum: sha256(JSON.stringify(course)),
        };
    });

    return {
        version: 1,
        exportedAt: dump.exportedAt,
        sourceRevision: dump.source.revision,
        contentChecksum: sha256(JSON.stringify(dump.courses)),
        totals: {
            courses: courses.length,
            published: courses.filter((course) => course.status === 'published')
                .length,
            draft: courses.filter((course) => course.status === 'draft').length,
            units: courses.reduce((total, course) => total + course.units, 0),
            lessons: courses.reduce(
                (total, course) => total + course.lessons,
                0,
            ),
            steps: courses.reduce((total, course) => total + course.steps, 0),
        },
        courses,
    };
}

function readGitRevision(sourceDir: string): string | null {
    let dir = resolve(sourceDir);

    while (dirname(dir) !== dir) {
        if (existsSync(join(dir, '.git'))) {
            try {
                return execFileSync(
                    'git',
                    ['-C', dir, 'rev-parse', '--short', 'HEAD'],
                    {
                        encoding: 'utf8',
                    },
                ).trim();
            } catch {
                return null;
            }
        }
        dir = dirname(dir);
    }

    return null;
}

export async function exportContent(
    sourceDir: string,
    outDir: string,
    exportedAt: string,
): Promise<{ dump: ContentDump; meta: ContentMeta }> {
    const courses = await loadCourses(sourceDir);
    const dump = buildContentDump(
        courses,
        sourceDir,
        readGitRevision(sourceDir),
        exportedAt,
    );
    const meta = summarize(dump);

    await mkdir(outDir, { recursive: true });
    await writeFile(
        join(outDir, 'content-dump.json'),
        `${JSON.stringify(dump, null, 2)}\n`,
    );
    await writeFile(
        join(outDir, 'content-dump.meta.json'),
        `${JSON.stringify(meta, null, 2)}\n`,
    );

    return { dump, meta };
}

async function main(): Promise<void> {
    const sourceDir = process.env.CONTENT_SOURCE ?? DEFAULT_SOURCE;
    const outDir =
        process.env.CONTENT_OUT ??
        fileURLToPath(new URL('../database/seeders/data/', import.meta.url));

    const { meta } = await exportContent(
        sourceDir,
        outDir,
        new Date().toISOString(),
    );

    console.log(`Exported content from ${sourceDir} to ${outDir}`);
    console.log(JSON.stringify(meta.totals));
}

const invokedDirectly =
    process.argv[1] !== undefined &&
    import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
    await main();
}
