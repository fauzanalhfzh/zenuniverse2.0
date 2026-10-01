import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

test('terminal output preserves lines and caps output', () => {
    const messages = [];
    const context = vm.createContext({ self: { postMessage: (message) => messages.push(message) } });
    vm.runInContext(readFileSync(new URL('../public/python-worker.js', import.meta.url), 'utf8'), context);
    vm.runInContext("output('Halo, Python!'); output('x'.repeat(25000)); output('ignored');", context);
    assert.equal(messages[0].text, 'Halo, Python!\n');
    assert.equal(messages.map((message) => message.text).join('').length, 20000);
    assert.equal(messages.length, 2);
});
