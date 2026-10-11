import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
    assertUniqueIds,
    summarize,
    type ContentDump,
} from './export-content.mts';

void test('AI module has complete lessons and private scenario answer keys', () => {
    const dump: ContentDump = JSON.parse(
        readFileSync(
            new URL(
                '../database/seeders/data/content-dump.json',
                import.meta.url,
            ),
            'utf8',
        ),
    );
    assertUniqueIds(dump.courses);
    const course = dump.courses.find(
        (course) => course.id === 'ai-fundamentals',
    );
    assert.ok(course);
    assert.equal(course.accessTier, 'free');
    const lessons = course.units.flatMap((unit) => unit.lessons);
    assert.equal(lessons.length, 8);
    for (const lesson of lessons) {
        assert.deepEqual(
            lesson.steps.map((step) => step.type),
            [
                'concept',
                'quiz',
                'concept',
                'quiz',
                'concept',
                'quiz',
                'flashcard',
                'matching',
                'unjumble',
            ],
        );
        for (const step of lesson.steps) {
            if (step.type === 'concept') {
                assert.ok(String(step.content.body).trim().length > 100);
            } else if (step.type === 'quiz') {
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
                assert.ok(String(step.content.explanation).trim());
                assert.equal('correctOptionId' in step.content, false);
            } else if (step.type === 'flashcard') {
                const cards = step.content.cards as {
                    id: string;
                    front: string;
                    back: string;
                }[];
                assert.equal(cards.length, 3);
                assert.equal(step.reward.xp, 0);
                assert.ok(
                    cards.every(
                        (card) => card.front.trim() && card.back.trim(),
                    ),
                );
            } else if (step.type === 'matching') {
                const left = step.content.left as { id: string }[];
                const right = step.content.right as { id: string }[];
                const pairs = step.validation?.pairs as Record<string, string>;
                assert.deepEqual(
                    Object.keys(pairs).sort(),
                    left.map((item) => item.id).sort(),
                );
                assert.deepEqual(
                    Object.values(pairs).sort(),
                    right.map((item) => item.id).sort(),
                );
            } else if (step.type === 'unjumble') {
                const tokens = step.content.tokens as { id: string }[];
                const order = step.validation?.correctOrder;
                assert.ok(Array.isArray(order));
                assert.deepEqual(
                    order.map(String).sort(),
                    tokens.map((token) => token.id).sort(),
                );
            }
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
