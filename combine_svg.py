#!/usr/bin/env python3

import os
import re
import sys
from xml.dom import minidom

def combine(files):
    yoffset = 0
    maxwidth = 0

    resultDoc = minidom.getDOMImplementation().createDocument('http://www.w3.org/2000/svg', 'svg', None)
    resultRoot = resultDoc.documentElement
    resultRoot.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

    for path in files:
        doc = minidom.parse(path)
        docRoot = doc.documentElement
        viewbox = docRoot.getAttribute('viewBox')
        if viewbox:
            x, y, width, height = map(int, re.split(r'\s+', viewbox))
        else:
            x = docRoot.getAttribute('x') or '0'
            y = docRoot.getAttribute('y') or '0'
            width = docRoot.getAttribute('width')
            height = docRoot.getAttribute('height')
            x, y, width, height = map(lambda s: int(re.sub(r'px$', '', s)), (x, y, width, height))

        maxwidth = max(maxwidth, width)

        view = resultDoc.createElement('view')
        view.setAttribute('id', os.path.splitext(os.path.basename(path))[0])
        view.setAttribute('viewBox', ' '.join(map(str, (0, yoffset, width, height))))
        resultRoot.appendChild(view)

        g = resultDoc.createElement('g')
        g.setAttribute('transform', 'translate({} {})'.format(-x, -y + yoffset))
        for node in docRoot.childNodes:
            if node.nodeType != node.ELEMENT_NODE or node.tagName == 'title':
                continue
            g.appendChild(resultDoc.importNode(node, True))
        resultRoot.appendChild(g)

        yoffset += height

    resultRoot.setAttribute('viewBox', ' '.join(map(str, (0, 0, maxwidth, yoffset))))
    print(resultDoc.toxml())


if __name__ == '__main__':
    combine(sys.argv[1:])
