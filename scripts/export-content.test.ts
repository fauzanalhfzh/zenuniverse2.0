import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import {
    assertUniqueIds,
    buildContentDump,
    loadCourses,
    summarize,
    type ExportedCourse,
} from './export-content.mts';

const SOURCE =
    process.env.CONTENT_SOURCE ??
    '/home/zen/Documents/Development/zenuniverse-fe/packages/content/src/data/lessons';
const EXPORTED_AT = '2026-09-18T00:00:00.000Z';
const HAS_SOURCE = existsSync(SOURCE);
const COURSES: ExportedCourse[] = HAS_SOURCE ? await loadCourses(SOURCE) : [];
const SKIP = HAS_SOURCE ? false : `Content source not reachable: ${SOURCE}`;

function course(id: string, stepIds: string[]): ExportedCourse {
    return {
        id,
        title: id,
        description: id,
        level: 'Pemula',
        status: 'published',
        units: [
            {
                id: `${id}-unit`,
                title: id,
                description: id,
                lessons: [
                    {
                        id: `${id}-lesson`,
                        title: id,
                        description: id,
                        completionRewardXp: 10,
                        steps: stepIds.map((stepId) => ({
                            id: stepId,
                            type: 'concept',
                            reward: { xp: 5 },
                            content: {},
                        })),
                    },
                ],
            },
        ],
    };
}

void test('rejects duplicate ids', () => {
    assert.throws(
        () => assertUniqueIds([course('a', ['same', 'same'])]),
        /Duplicate content step id: same/,
    );
});

void test('loads six courses with C++ as draft', { skip: SKIP }, () => {
    const courses = COURSES;

    assert.equal(courses.length, 6);
    assert.deepEqual(
        courses.map((item) => item.id),
        [
            'blockly-basics',
            'python-fundamentals',
            'javascript-fundamentals',
            'html-fundamentals',
            'css-fundamentals',
            'cpp-fundamentals',
        ],
    );
    assert.equal(courses.filter((item) => item.status === 'draft').length, 1);
    assert.equal(
        courses.find((item) => item.id === 'cpp-fundamentals')?.status,
        'draft',
    );
});

void test('includes generated code-practice steps', { skip: SKIP }, () => {
    const courses = COURSES;
    const js = courses.find((item) => item.id === 'javascript-fundamentals');
    assert.ok(js, 'javascript course exists');

    const practiceSteps = js.units
        .flatMap((unit) => unit.lessons)
        .flatMap((lesson) => lesson.steps)
        .filter(
            (step) => step.type === 'code-fill' || step.type === 'code-arrange',
        );

    assert.ok(practiceSteps.length > 0, 'generated practice steps were added');
});

void test(
    'keeps private answers, challenges, and all step types',
    { skip: SKIP },
    () => {
        const courses = COURSES;
        const steps = courses.flatMap((item) =>
            item.units.flatMap((unit) =>
                unit.lessons.flatMap((lesson) => lesson.steps),
            ),
        );
        const types = new Set(steps.map((step) => step.type));

        for (const type of [
            'concept',
            'quiz',
            'blockly',
            'code-arrange',
            'code-fill',
            'code',
        ]) {
            assert.ok(types.has(type as never), `step type ${type} present`);
        }

        const quiz = steps.find((step) => step.type === 'quiz');
        assert.ok(
            quiz?.validation && 'correctOptionId' in quiz.validation,
            'quiz keeps correctOptionId',
        );

        const code = steps.find((step) => step.type === 'code');
        assert.ok(
            'expectedCode' in (code?.content ?? {}),
            'code keeps expectedCode',
        );

        const blockly = steps.find((step) => step.type === 'blockly');
        assert.ok(blockly?.challenge, 'blockly keeps challenge config');
    },
);

void test('produces deterministic checksum', { skip: SKIP }, () => {
    const courses = COURSES;
    const first = summarize(
        buildContentDump(courses, SOURCE, 'test', EXPORTED_AT),
    );
    const second = summarize(
        buildContentDump(courses, SOURCE, 'test', EXPORTED_AT),
    );

    assert.equal(first.contentChecksum, second.contentChecksum);
    assert.deepEqual(first.totals, second.totals);
    assert.equal(first.totals.courses, 6);
    assert.equal(first.totals.draft, 1);
});
