/** Devuelve la fecha local en formato YYYY-MM-DD. */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Una tarea está vencida si su fecha límite es anterior a hoy. */
export function isOverdue(dueDate: string | null, today: Date = new Date()): boolean {
  if (!dueDate) return false;
  return dueDate < toISODate(today);
}

/** Convierte YYYY-MM-DD en DD/MM/YYYY. */
export function formatDueDate(dueDate: string): string {
  const [year, month, day] = dueDate.split('-');
  if (!year || !month || !day) return dueDate;
  return `${day}/${month}/${year}`;
}
