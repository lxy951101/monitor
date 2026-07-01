export interface ScriptDocument {
  createElement: (tagName: "script") => {
    src: string;
    async: boolean;
    onload: (() => void) | null;
    onerror: ((error: unknown) => void) | null;
  };
  head: {
    appendChild: (element: unknown) => void;
  };
}

export interface LoadLoganScriptOptions {
  version: string;
  cdnPrefixes: readonly string[];
  document?: ScriptDocument;
}

export function createLoganScriptUrl(version: string, cdnPrefixes: readonly string[]): string {
  const prefix = cdnPrefixes[0] ?? "";
  return `${prefix}${version}.js`;
}

export function loadLoganScript(options: LoadLoganScriptOptions): Promise<void> {
  const documentLike = options.document ?? getRuntimeDocument();
  if (!documentLike) {
    return Promise.reject(new Error("document is not available"));
  }

  return new Promise((resolve, reject) => {
    const script = documentLike.createElement("script");
    script.async = true;
    script.src = createLoganScriptUrl(options.version, options.cdnPrefixes);
    script.onload = () => resolve();
    script.onerror = reject;
    documentLike.head.appendChild(script);
  });
}

function getRuntimeDocument(): ScriptDocument | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }

  return document as unknown as ScriptDocument;
}

