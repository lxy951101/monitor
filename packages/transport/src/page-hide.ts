export function onPageHide(callback: () => void): () => void {
  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      callback();
    }
  };

  const onPageHide = () => {
    callback();
  };

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisibilityChange);
  }

  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", onPageHide);
  }

  return () => {
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }

    if (typeof window !== "undefined") {
      window.removeEventListener("pagehide", onPageHide);
    }
  };
}
