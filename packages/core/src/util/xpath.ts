interface XPathElementLike {
  id?: string;
  nodeName?: string;
  nodeType?: number;
  parentElement?: XPathElementLike | null;
  children?: ArrayLike<XPathElementLike>;
}

export function getXPath(element: Element | null | undefined): string {
  const target = element as XPathElementLike | null | undefined;

  if (!target || target.nodeType !== 1) {
    return "";
  }

  if (target.id) {
    return `//*[@id=${quoteXPathString(target.id)}]`;
  }

  const segments: string[] = [];
  let current: XPathElementLike | null | undefined = target;

  while (current && current.nodeType === 1) {
    const name = String(current.nodeName ?? "").toLowerCase();
    const index = getElementIndex(current);
    segments.unshift(`${name}[${index}]`);
    current = current.parentElement;
  }

  return `/${segments.join("/")}`;
}

function getElementIndex(element: XPathElementLike): number {
  const parent = element.parentElement;

  if (!parent?.children) {
    return 1;
  }

  const name = String(element.nodeName ?? "").toLowerCase();
  let index = 0;

  for (let i = 0; i < parent.children.length; i += 1) {
    const child = parent.children[i];

    if (String(child.nodeName ?? "").toLowerCase() === name) {
      index += 1;
    }

    if (child === element) {
      return index;
    }
  }

  return 1;
}

function quoteXPathString(value: string): string {
  if (!value.includes("\"")) {
    return `"${value}"`;
  }

  if (!value.includes("'")) {
    return `'${value}'`;
  }

  return `concat("${value.replace(/"/gu, "\", '\"', \"")}")`;
}
