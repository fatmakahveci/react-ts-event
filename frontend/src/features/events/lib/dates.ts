export function localDate(date = new Date()) {
  // An ISO conversion uses UTC and can move today's date across midnight for the visitor.
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function formatDate(value: string) {
  // Parse a calendar date in local time; bare YYYY-MM-DD strings are interpreted as UTC.
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
