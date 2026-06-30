import type { ResourceCallInput } from "./resource-manager";

export interface ResourceErrorTarget {
  addEventListener: (type: string, listener: EventListener, options?: boolean | AddEventListenerOptions) => void;
  removeEventListener: (type: string, listener: EventListener, options?: boolean | EventListenerOptions) => void;
}

export function startResourceErrorCapture(
  target: ResourceErrorTarget,
  onCall: (call: ResourceCallInput) => void
): () => void {
  const listener = (event: Event) => {
    const element = event.target as Partial<HTMLElement> | null;
    const resourceUrl = readResourceUrl(element);
    if (!resourceUrl) {
      return;
    }

    onCall({
      resourceUrl,
      type: readResourceType(element),
      connectType: "resourceError",
      statusCode: 0,
      firstCategory: "resourceError",
      secondCategory: readResourceType(element),
      logContent: "resource load failed"
    });
  };

  target.addEventListener("error", listener, true);
  return () => target.removeEventListener("error", listener, true);
}

function readResourceUrl(element: Partial<HTMLElement> | null): string {
  return String(
    element?.getAttribute?.("src") ??
      element?.getAttribute?.("href") ??
      (element as { src?: string; href?: string } | null)?.src ??
      (element as { src?: string; href?: string } | null)?.href ??
      ""
  );
}

function readResourceType(element: Partial<HTMLElement> | null): string {
  return element?.tagName?.toLowerCase() ?? "resource";
}

