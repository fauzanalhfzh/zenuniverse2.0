import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
    assertUniqueIds,
    summarize,
    type ContentDump,
} from './export-content.mts';

const dump: ContentDump = JSON.parse(
    readFileSync(
        new URL('../database/seeders/data/content-dump.json', import.meta.url),
        'utf8',
    ),
);

void test('Python expansion provides complete, selectable exercises with private answer keys', () => {
    assertUniqueIds(dump.courses);
    const course = dump.courses.find(
        (item) => item.id === 'python-fundamentals',
    );
    assert.ok(course);
    const lessons = course.units
        .filter((unit) =>
            [
                'python-unit-11',
                'python-unit-12',
                'python-unit-13',
                'python-unit-14',
            ].includes(unit.id),
        )
        .flatMap((unit) => unit.lessons);
    assert.equal(lessons.length, 12);
    for (const lesson of lessons) {
        assert.equal(lesson.steps.length, 8);
        assert.equal(
            lesson.steps.filter((step) => step.type === 'concept').length,
            3,
        );
        assert.equal(
            lesson.steps.filter((step) => step.type === 'quiz').length,
            3,
        );
        assert.equal(
            lesson.steps.filter((step) => step.type === 'code-fill').length,
            2,
        );
        for (const step of lesson.steps) {
            if (step.type === 'quiz') {
                const options = step.content.options as {
                    id: string;
                    label: string;
                }[];
                assert.equal(options.length, 4);
                assert.equal(
                    new Set(options.map((option) => option.label)).size,
                    4,
                );
                assert.ok(
                    options.some(
                        (option) =>
                            option.id === step.validation?.correctOptionId,
                    ),
                );
                assert.equal(step.content.language, 'python');
                assert.ok(String(step.content.explanation).trim());
            } else if (step.type === 'code-fill') {
                const blanks = step.content.blanks as {
                    id: string;
                    mode: string;
                    options: string[];
                }[];
                const parts = step.content.parts as string[];
                const accepted = step.validation?.acceptedAnswers as Record<
                    string,
                    string[]
                >;
                assert.equal(parts.length, blanks.length + 1);
                assert.deepEqual(
                    Object.keys(accepted),
                    blanks.map((blank) => blank.id),
                );
                for (const blank of blanks) {
                    assert.equal(blank.mode, 'choice');
                    assert.ok(blank.options.length >= 3);
                    assert.equal(
                        new Set(blank.options).size,
                        blank.options.length,
                    );
                    assert.ok(
                        accepted[blank.id].every((answer) =>
                            blank.options.includes(answer),
                        ),
                    );
                }
            }
            assert.equal('acceptedAnswers' in step.content, false);
            assert.equal('correctOptionId' in step.content, false);
        }
    }
    assert.deepEqual(
        JSON.parse(
            readFileSync(
                new URL(
                    '../database/seeders/data/content-dump.meta.json',
                    import.meta.url,
                ),
                'utf8',
            ),
        ),
        summarize(dump),
    );
});
