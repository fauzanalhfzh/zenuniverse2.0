import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'design/home.html');
const outDir = path.join(root, 'public/illustrations');

const html = fs.readFileSync(source, 'utf8');

const round = (value) => {
    const n = Math.round(Number(value) * 10000) / 10000;
    return String(Object.is(n, -0) ? 0 : n);
};

const normalizeViewBox = (value) =>
    value
        .trim()
        .split(/\s+/)
        .map((token) => {
            const n = Math.round(Number(token) * 10000) / 10000;
            return String(Object.is(n, -0) ? 0 : n);
        })
        .join(' ');

function extractDiv(htmlText, marker) {
    const idx = htmlText.indexOf(marker);
    if (idx < 0) throw new Error(`marker not found: ${marker}`);
    const openEnd = htmlText.indexOf('>', idx);
    let i = openEnd + 1;
    let depth = 1;
    while (i < htmlText.length) {
        const next = htmlText.indexOf('<', i);
        if (next < 0) break;
        if (htmlText.startsWith('</div', next)) {
            depth -= 1;
            if (depth === 0) return htmlText.slice(openEnd + 1, next);
            i = next + 5;
        } else if (
            htmlText.startsWith('<div', next) &&
            /[\s>]/.test(htmlText[next + 4] ?? '')
        ) {
            depth += 1;
            i = next + 4;
        } else {
            i = next + 1;
        }
    }
    throw new Error('unbalanced div');
}

function matchClose(text, start, tag) {
    const openEnd = text.indexOf('>', start);
    let depth = 1;
    let i = openEnd + 1;
    const openNeedle = `<${tag}`;
    const closeNeedle = `</${tag}`;
    while (i < text.length) {
        const next = text.indexOf('<', i);
        if (next < 0) throw new Error(`unbalanced ${tag}`);
        if (text.startsWith(closeNeedle, next)) {
            depth -= 1;
            if (depth === 0) return text.indexOf('>', next) + 1;
            i = next + closeNeedle.length;
        } else if (
            text.startsWith(openNeedle, next) &&
            /[\s>]/.test(text[next + openNeedle.length] ?? '')
        ) {
            depth += 1;
            i = next + openNeedle.length;
        } else {
            i = next + 1;
        }
    }
    throw new Error(`unbalanced end ${tag}`);
}

function topElements(content) {
    const out = [];
    let i = 0;
    while (i < content.length) {
        const next = content.indexOf('<', i);
        if (next < 0) break;
        const rest = content.slice(next);
        if (rest.startsWith('<svg')) {
            const end = matchClose(content, next, 'svg');
            out.push({ tag: 'svg', html: content.slice(next, end) });
            i = end;
        } else if (
            rest.startsWith('<div') &&
            /[\s>]/.test(content[next + 4] ?? '')
        ) {
            const end = matchClose(content, next, 'div');
            out.push({ tag: 'div', html: content.slice(next, end) });
            i = end;
        } else {
            i = next + 1;
        }
    }
    return out;
}

const classOf = (tag) => {
    const match = tag.match(/class="([^"]*)"/);
    return match ? match[1] : '';
};
const attr = (tag, name) => {
    const match = tag.match(new RegExp(`${name}="([^"]*)"`));
    return match ? match[1] : '';
};
const px = (cls, token) => {
    const m = cls.match(new RegExp(`${token}-\\[([0-9.]+)px\\]`));
    return m ? m[1] : null;
};

const emptyViewBox = new Set(['0 0 0 0', '0 0 1 1']);

function svgShape(element) {
    const viewBox = normalizeViewBox(attr(element, 'viewBox'));
    if (emptyViewBox.has(viewBox)) return '';
    const inner = element
        .slice(element.indexOf('>') + 1, element.lastIndexOf('</svg>'))
        .trim();
    if (!/<path/.test(inner)) return '';
    const paths = [...inner.matchAll(/<path\b[^>]*>/g)].map((m) => m[0]);
    if (paths.every((p) => /d="\s*"/.test(p) || !/\bd="/.test(p))) return '';
    const cls = classOf(element);
    const width = px(cls, 'w') ?? '1';
    const height = px(cls, 'h') ?? '1';
    const left = px(cls, 'left') ?? '0';
    const top = px(cls, 'top') ?? '0';
    return `<svg x="${round(left)}" y="${round(top)}" width="${round(width)}" height="${round(height)}" viewBox="${viewBox}" preserveAspectRatio="none" overflow="visible">${inner}</svg>`;
}

function divShape(element) {
    const cls = classOf(element);
    const width = Number(px(cls, 'w') ?? 0);
    const height = Number(px(cls, 'h') ?? 0);
    const left = Number(px(cls, 'left') ?? 0);
    const top = Number(px(cls, 'top') ?? 0);
    const bgMatch = cls.match(/bg-\[(#(?:[0-9a-fA-F]{3,8}))\]/);
    const bg = bgMatch ? bgMatch[1] : '';
    if (!bg || width <= 0 || height <= 0) return '';
    const outline = cls.match(
        /\[outline:([0-9.]+)px_solid_(#[0-9a-fA-F]{3,8})\]/,
    );
    const stroke = outline
        ? ` stroke="${outline[2]}" stroke-width="${round(outline[1])}"`
        : '';
    const clip = cls.match(/\[clip-path:path\('([^']+)'\)\]/);
    const radius = cls.match(/rounded-\[([0-9.]+)px\]/);
    const transform = `transform="translate(${round(left)} ${round(top)})"`;
    if (clip) {
        const d = clip[1].replace(/_/g, ' ');
        return `<g ${transform}><path d="${d}" fill="${bg}" fill-rule="evenodd"${stroke} /></g>`;
    }
    if (radius && !cls.includes('rounded-full')) {
        return `<rect x="${round(left)}" y="${round(top)}" width="${round(width)}" height="${round(height)}" rx="${round(radius[1])}" fill="${bg}"${stroke} />`;
    }
    const cx = left + width / 2;
    const cy = top + height / 2;
    const r = width / 2;
    return `<circle cx="${round(cx)}" cy="${round(cy)}" r="${round(r)}" fill="${bg}"${stroke} />`;
}

function build(marker, width, height, title, output) {
    const group = extractDiv(html, marker);
    const parts = topElements(group).map((element) =>
        element.tag === 'svg' ? svgShape(element.html) : divShape(element.html),
    );
    const body = parts.filter(Boolean).join('\n  ');
    const doc = [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="title">`,
        `  <title id="title">${title}</title>`,
        `  ${body}`,
        '</svg>',
        '',
    ].join('\n');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, output), doc);
    return {
        output,
        bytes: Buffer.byteLength(doc),
        shapes: parts.filter(Boolean).length,
    };
}

const results = [
    build(
        'data-pencil-name="ZenUniverse / Coding explorers SVG"',
        520,
        500,
        'Ilustrasi Coding Explorers',
        'hero-coding-explorers.svg',
    ),
    build(
        'data-pencil-name="ZenUniverse / Valley explorers SVG"',
        1440,
        540,
        'Ilustrasi Valley Explorers',
        'valley-explorers.svg',
    ),
];

for (const result of results) {
    console.log(
        `${result.output}: ${result.shapes} shapes, ${result.bytes} bytes`,
    );
}
