export function guid(): string {
 return "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".replace(/x/g, () => {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
   return (crypto.getRandomValues(new Uint8Array(1))[0] % 16).toString(16);
  }

  return (Math.random() * 16 | 0).toString(16);
 });
}
