from html.parser import HTMLParser
from pathlib import Path
import re
import xml.etree.ElementTree as ET

BASE = Path(__file__).resolve().parent

class TreeParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.root = ET.Element('document')
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        element = ET.SubElement(self.stack[-1], tag, dict(attrs))
        if tag not in {'meta', 'link', 'br', 'img', 'input', 'hr'}:
            self.stack.append(element)

    def handle_endtag(self, tag):
        if self.stack[-1].tag == tag:
            self.stack.pop()


def slug(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


def convert(source, is_root=False):
    styles = dict(item.strip().split(':', 1) for item in source.get('style', '').split(';') if ':' in item)
    name = source.get('data-pencil-name', '')
    attrs = {'id': slug(name)} if name else {}
    if source.tag == 'div':
        result = ET.Element('g', attrs)
        if not is_root:
            x = styles.get('left', '0').strip().removesuffix('px')
            y = styles.get('top', '0').strip().removesuffix('px')
            transform = f'translate({x} {y})'
            rotation = re.search(r'rotate\(([-\d.]+)deg\)', styles.get('transform', ''))
            if rotation:
                transform += f' rotate({rotation.group(1)})'
            result.set('transform', transform)
        if 'background-color' in styles:
            width = float(styles['width'].strip().removesuffix('px'))
            height = float(styles['height'].strip().removesuffix('px'))
            paint = {'fill': styles['background-color'].strip()}
            if styles.get('border-radius', '').strip() == '50%':
                paint.update({'cx': str(width / 2), 'cy': str(height / 2), 'rx': str(width / 2), 'ry': str(height / 2)})
                ET.SubElement(result, 'ellipse', paint)
            else:
                paint.update({'width': str(width), 'height': str(height)})
                ET.SubElement(result, 'rect', paint)
    elif source.tag == 'svg':
        attrs.update({k: v for k, v in source.attrib.items() if k not in {'style', 'data-pencil-name', 'xmlns'}})
        attrs['viewBox'] = attrs.pop('viewbox')
        attrs['preserveAspectRatio'] = attrs.pop('preserveaspectratio', 'none')
        for style, attribute in [('left', 'x'), ('top', 'y'), ('width', 'width'), ('height', 'height')]:
            attrs[attribute] = styles.get(style, '0').strip().removesuffix('px')
        attrs['overflow'] = 'visible'
        result = ET.Element('svg', attrs)
    else:
        attrs.update({k: v for k, v in source.attrib.items() if k not in {'style', 'data-pencil-name'}})
        result = ET.Element(source.tag, attrs)
    if 'opacity' in styles:
        result.set('opacity', styles['opacity'].strip())
    for child in source:
        if child.tag in {'div', 'svg', 'g', 'path', 'ellipse', 'circle', 'rect', 'polygon'}:
            result.append(convert(child))
    return result


parser = TreeParser()
parser.feed((BASE / 'poses.html').read_text(encoding='utf-8'))
poses = [node for node in parser.root.iter('div') if node.get('data-pencil-name', '').startswith('Orangutan')]
filenames = ['01-tangan-turun.svg', '02-mulai-menyapa.svg', '03-telapak-tengah.svg', '04-ayun-masuk.svg', '05-ayun-keluar.svg']
if len(poses) != len(filenames):
    raise ValueError(f'Expected five poses, found {len(poses)}')
for pose, filename in zip(poses, filenames):
    svg = ET.Element('svg', {'xmlns': 'http://www.w3.org/2000/svg', 'width': '512', 'height': '512', 'viewBox': '0 0 512 512', 'role': 'img'})
    ET.SubElement(svg, 'title').text = pose.get('data-pencil-name')
    svg.append(convert(pose, is_root=True))
    ET.indent(svg)
    target = BASE / filename
    ET.ElementTree(svg).write(target, encoding='utf-8', xml_declaration=True)
    ET.parse(target)
    print(target.name)
