import type { CfgManager } from "@monitor/core";
import type { ResourceCallInput } from "./resource-manager";

export interface ResourceErrorTarget {
  addEventListener: (
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions,
  ) => void;
  removeEventListener: (
    type: string,
    listener: EventListener,
    options?: boolean | EventListenerOptions,
  ) => void;
}

export interface ResourceErrorOptions {
  cfgManager?: CfgManager;
}

export function startResourceErrorCapture(
  target: ResourceErrorTarget,
  onCall: (call: ResourceCallInput) => void,
  options: ResourceErrorOptions = {},
): () => void {
  const listener = (event: Event) => {
    const element = event.target as HTMLElement | null;
    if (!element) return;

    // 元素类型过滤
    const nodeName = (element.nodeName || "").toLowerCase();
    if (!["script", "link", "img"].includes(nodeName)) return;

    const url =
      element.getAttribute?.("src") ??
      element.getAttribute?.("href") ??
      ((element as unknown as Record<string, unknown>).src as string) ??
      ((element as unknown as Record<string, unknown>).href as string) ??
      "";
    if (!url) return;

    // 懒加载图片过滤
    if (typeof location !== "undefined") {
      const href = location.href;
      if (href && href.indexOf(url) === 0) return;
    }
    const urlShort = nodeName === "img" ? getImageDomain(url) : url;
    if (!urlShort) return;

    // resourceReg + ignoreList 过滤
    if (!filterResourceUrl(urlShort, options.cfgManager)) return;

    // XPath 提取
    const xpath = getXPath(element);
    const content = url + (xpath ? `\n${xpath}` : "");

    onCall({
      resourceUrl: urlShort,
      type: nodeName,
      connectType: "resourceError",
      statusCode: 500,
      firstCategory: "resourceError",
      secondCategory: nodeName,
      logContent: content,
    });
  };

  target.addEventListener("error", listener, true);
  return () => target.removeEventListener("error", listener, true);
}

function filterResourceUrl(url: string, cfgManager?: CfgManager): boolean {
  try {
    // resourceReg 过滤
    const devMode = cfgManager?.getConfig("devMode") ?? false;
    const resReg = cfgManager?.getConfig("resource").resourceReg;
    if (!devMode && resReg && !resReg.test(url)) return false;

    // ignoreList.resource 过滤
    const ignoreList =
      cfgManager?.getConfig("resource").ignoreList ?? ([] as Array<string | RegExp>);
    for (const item of ignoreList) {
      const reg = typeof item === "string" ? new RegExp(item) : item;
      if (reg.test(url)) return false;
    }
    return true;
  } catch {
    return true;
  }
}

function getImageDomain(url: string): string {
  const arr = url.split("//");
  if (arr.length > 1) {
    return arr[0] + "//" + arr[1].split("/")[0] + "/images";
  }
  return url;
}

/** XPath 提取 */
function getXPath(element: HTMLElement): string {
  if (!element || element.nodeType !== 1) return "";
  if (element.id) return `//${element.nodeName.toLowerCase()}[@id="${element.id}"]`;

  const parts: string[] = [];
  let current: HTMLElement | null = element;
  while (current && current.nodeType === 1) {
    let index = 1;
    let sibling: HTMLElement | null = current.previousElementSibling as HTMLElement | null;
    while (sibling) {
      if (sibling.nodeName === current.nodeName) index++;
      sibling = sibling.previousElementSibling as HTMLElement | null;
    }
    const tag = current.nodeName.toLowerCase();
    parts.unshift(`${tag}[${index}]`);
    current = current.parentElement;
  }
  return "/" + parts.join("/");
}
