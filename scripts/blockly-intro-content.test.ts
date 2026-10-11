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

void test('Blockly introduction adds one private text fill per lesson without replacing existing steps', () => {
    assertUniqueIds(dump.courses);
    const course = dump.courses.find((item) => item.id === 'blockly-basics');
    assert.ok(course);
    const intro = course.units.find(
        (unit) => unit.id === 'blockly-unit-introduction',
    );
    assert.ok(intro);
    assert.equal(intro.lessons.length, 8);

    for (const [index, lesson] of intro.lessons.entries()) {
        const id = `blockly-intro-lesson-${String(index + 1).padStart(2, '0')}`;
        assert.equal(lesson.id, id);
        assert.equal(lesson.completionRewardXp, 20);
        assert.deepEqual(
            lesson.steps
                .filter((step) => step.type !== 'code-fill')
                .map((step) => [step.id, step.type]),
            ['concept', 'quiz', 'concept', 'quiz'].map((type, i) => [
                `${id}-step-${i + 1}`,
                type,
            ]),
        );
        const fills = lesson.steps.filter((step) => step.type === 'code-fill');
        assert.equal(fills.length, 1);
        const fill = fills[0];
        assert.equal(fill.id, `${id}-fill-1`);
        assert.equal(fill.reward.xp, 5);
        assert.equal(fill.content.language, 'text');
        for (const key of ['title', 'instructions', 'hint']) {
            assert.equal(typeof fill.content[key], 'string');
            assert.ok(String(fill.content[key]).trim());
        }
        const parts = fill.content.parts as string[];
        const blanks = fill.content.blanks as { id: string; mode: string }[];
        const answers = fill.validation?.acceptedAnswers as Record<
            string,
            string[]
        >;
        assert.ok(
            Array.isArray(parts) &&
                parts.every((part) => typeof part === 'string'),
        );
        assert.ok(Array.isArray(blanks) && blanks.length > 0);
        assert.equal(parts.length, blanks.length + 1);
        assert.deepEqual(
            Object.keys(answers).sort(),
            blanks.map((blank) => blank.id).sort(),
        );
        blanks.forEach((blank, i) => {
            assert.deepEqual(blank, { id: `blank-${i + 1}`, mode: 'text' });
            assert.ok(answers[blank.id].length > 0);
            for (const answer of answers[blank.id]) {
                assert.equal(typeof answer, 'string');
                assert.ok(answer.trim());
                assert.ok(answers[blank.id].includes(answer.toLowerCase()));
                assert.ok(answers[blank.id].includes(answer.toUpperCase()));
            }
        });
        assert.equal('acceptedAnswers' in fill.content, false);
    }

    const steps = course.units.flatMap((unit) =>
        unit.lessons.flatMap((lesson) => lesson.steps),
    );
    assert.ok(steps.some((step) => step.type === 'blockly' && step.challenge));
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
