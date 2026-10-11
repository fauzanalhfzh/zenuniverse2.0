export function quizPresentation(
    question: string | undefined,
    language?: string,
    code?: string,
) {
    const original = {
        question: question ?? 'Cek pemahaman',
        code: null as string | null,
    };
    if (code?.trim()) return { ...original, code };
    if (!question || language !== 'python') return original;

    const atom = String.raw`(?:-?\d+(?:\.\d+)?|"[^"\n]*"|'[^'\n]*'|[A-Za-z_]\w*)`;
    const assignment = new RegExp(
        String.raw`^[A-Za-z_]\w*\s*=\s*${atom}(?:\s*[+*/%-]\s*${atom})*$`,
    );
    const sequence = question.match(
        /^Apa nilai akhir ([A-Za-z_]\w*) setelah (.+)\?$/,
    );
    if (sequence) {
        const lines = sequence[2].split(/\s+lalu\s+/);
        if (lines.every((line) => assignment.test(line))) {
            return {
                question: `Apa nilai akhir ${sequence[1]} setelah kode berikut dijalankan?`,
                code: lines.join('\n'),
            };
        }
    }

    const context = question.match(/^Pada (.+), (.+\?)$/);
    if (context && assignment.test(context[1])) {
        return {
            question: `Pada kode berikut, ${context[2]}`,
            code: context[1],
        };
    }

    const output = question.match(/^Apa output dari (print\(.+\))\?$/);
    if (output)
        return { question: 'Apa output dari kode berikut?', code: output[1] };

    const expression = question.match(
        /^Berapa hasil (-?\d+(?:\.\d+)?\s*[+*/%-]\s*-?\d+(?:\.\d+)?)\?$/,
    );
    if (expression)
        return {
            question: 'Berapa hasil ekspresi berikut?',
            code: expression[1],
        };

    const dataType = question.match(/^Apa tipe data dari (.+)\?$/);
    if (dataType && new RegExp(`^${atom}$`).test(dataType[1])) {
        return {
            question: 'Apa tipe data dari nilai berikut?',
            code: dataType[1],
        };
    }

    const loop = question.match(
        /^Berapa kali isi (for [A-Za-z_]\w* in range\(\d+\)) dijalankan\?$/,
    );
    if (loop)
        return {
            question: 'Berapa kali isi perulangan berikut dijalankan?',
            code: `${loop[1]}:`,
        };

    const range = question.match(/^Apa nilai pertama dari (range\(\d+\))\?$/);
    if (range)
        return {
            question: 'Apa nilai pertama dari rentang berikut?',
            code: range[1],
        };

    return original;
}
