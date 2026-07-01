export interface FirstScreenNode {
  tagName: string;
  top: number;
  height: number;
  width: number;
  textLength?: number;
  loadTime?: number;
}

export interface FirstScreenResult {
  time: number;
  score: number;
  detail: FirstScreenNode[];
}

export interface FirstScreenObserverEnv {
  MutationObserver: new (callback: (records: MutationRecord[]) => void) => {
    observe: (target: Node, options: MutationObserverInit) => void;
    disconnect: () => void;
  };
  document: { body: Node };
  viewportHeight: number;
  now?: () => number;
}

export interface FirstScreenObserverOptions {
  env: FirstScreenObserverEnv;
  onResult: (result: FirstScreenResult) => void;
}

export function calculateNodeWeight(node: FirstScreenNode, viewportHeight: number): number {
  if (node.top >= viewportHeight || node.height <= 0 || node.width <= 0) {
    return 0;
  }

  const visibleHeight = Math.min(node.height, viewportHeight - Math.max(0, node.top));
  const area = visibleHeight * node.width;
  const textBonus = node.textLength ? Math.min(node.textLength, 200) : 0;
  return Math.round(area + textBonus);
}

export function calculateFirstScreen(nodes: FirstScreenNode[], viewportHeight: number): FirstScreenResult {
  const visible = nodes
    .map((node) => ({ node, score: calculateNodeWeight(node, viewportHeight) }))
    .filter((item) => item.score > 0);
  const time = Math.max(0, ...visible.map((item) => item.node.loadTime ?? 0));
  const score = visible.reduce((sum, item) => sum + item.score, 0);

  return {
    time,
    score,
    detail: visible.map((item) => item.node)
  };
}

export function startFirstScreenObserver(options: FirstScreenObserverOptions): () => void {
  const nodes: FirstScreenNode[] = [];
  const now = options.env.now ?? Date.now;
  const observer = new options.env.MutationObserver((records) => {
    for (const record of records) {
      nodes.push(...readAddedNodes(record.addedNodes, now()));
    }

    options.onResult(calculateFirstScreen(nodes, options.env.viewportHeight));
  });

  observer.observe(options.env.document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}

function readAddedNodes(nodes: NodeList, loadTime: number): FirstScreenNode[] {
  return Array.from(nodes).flatMap((node) => {
    if (!isElementLike(node)) {
      return [];
    }

    return [readElement(node, loadTime)];
  });
}

function readElement(element: ElementLike, loadTime: number): FirstScreenNode {
  const rect = element.getBoundingClientRect();
  return {
    tagName: element.tagName,
    top: rect.top,
    height: rect.height,
    width: rect.width,
    textLength: element.textContent?.length,
    loadTime
  };
}

interface ElementLike {
  tagName: string;
  textContent?: string | null;
  getBoundingClientRect: () => { top: number; height: number; width: number };
}

function isElementLike(node: Node): node is Node & ElementLike {
  const candidate = node as Partial<ElementLike>;
  return typeof candidate.tagName === "string" && typeof candidate.getBoundingClientRect === "function";
}
