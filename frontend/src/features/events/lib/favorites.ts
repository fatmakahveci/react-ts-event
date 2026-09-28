import { useEffect, useState } from "react";
const KEY = "gather:favorite-events";
const CHANGE = "gather:favorites-changed";
function readFavorites(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch { return []; }
}
export function useFavorites() {
  const [favorites, setFavorites] = useState(readFavorites);
  const [error, setError] = useState("");
  useEffect(() => {
    const sync = () => setFavorites(readFavorites());
    window.addEventListener("storage", sync);
    window.addEventListener(CHANGE, sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener(CHANGE, sync); };
  }, []);
  function toggle(id: string) {
    const current = readFavorites();
    const next = current.includes(id) ? current.filter(value => value !== id) : [...current, id];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setFavorites(next); setError("");
      // The browser's storage event only reaches other tabs; update other lists in this tab too.
      window.dispatchEvent(new Event(CHANGE));
    } catch { setError("Your browser could not save favorites. Allow storage and try again."); }
  }
  return { favorites, toggle, error };
}
