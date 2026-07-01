export function getXPath(element: Element | null | undefined): string {
 if (!element || element.nodeType !== 1) {
  return "";
 }

 if (element.id) {
  return `//*[@id="${element.id}"]`;
 }

 const segments: string[] = [];
 let current: Element | null = element;

 while (current && current.nodeType === 1) {
  segments.unshift(createSegment(current));
  current = current.parentElement;
 }

 return `/${segments.join("/")}`;
}

function createSegment(element: Element): string {
 const name = element.nodeName.toLowerCase();
 const siblings = element.parentElement
  ? [...element.parentElement.children].filter((child) => child.nodeName === element.nodeName)
  : [];

 if (siblings.length <= 1) {
  return name;
 }

 return `${name}[${siblings.indexOf(element) + 1}]`;
}
