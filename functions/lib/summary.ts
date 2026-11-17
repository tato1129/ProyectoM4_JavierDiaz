import type { TaskRecord } from '../types';

export interface SummaryCounts {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
}

export interface SummaryContent {
  subject: string;
  text: string;
  html: string;
  counts: SummaryCounts;
}

const PRIORITY_LABELS: Record<TaskRecord['priority'], string> = {
  high: 'alta',
  medium: 'media',
  low: 'baja',
};

const PRIORITY_WEIGHT: Record<TaskRecord['priority'], number> = { high: 0, medium: 1, low: 2 };

/** Escapa el contenido escrito por el usuario antes de insertarlo en el HTML del email. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return year && month && day ? `${day}/${month}/${year}` : isoDate;
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function sortForSummary(tasks: TaskRecord[]): TaskRecord[] {
  return [...tasks].sort((a, b) => {
    const byPriority = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    if (byPriority !== 0) return byPriority;
    if (a.dueDate === b.dueDate) return a.order - b.order;
    if (a.dueDate === null) return 1;
    if (b.dueDate === null) return -1;
    return a.dueDate < b.dueDate ? -1 : 1;
  });
}

export function buildSummary(tasks: TaskRecord[], today: Date = new Date()): SummaryContent {
  const todayISO = toISODate(today);
  const pendingTasks = sortForSummary(tasks.filter((task) => !task.completed));
  const completedTasks = sortForSummary(tasks.filter((task) => task.completed));
  const isOverdue = (task: TaskRecord) => task.dueDate !== null && task.dueDate < todayISO;

  const counts: SummaryCounts = {
    total: tasks.length,
    completed: completedTasks.length,
    pending: pendingTasks.length,
    overdue: pendingTasks.filter(isOverdue).length,
  };

  const subject = `Resumen de tus tareas: ${plural(counts.pending, 'pendiente', 'pendientes')} y ${plural(
    counts.completed,
    'completada',
    'completadas',
  )}`;

  const describe = (task: TaskRecord): string => {
    const parts = [`prioridad ${PRIORITY_LABELS[task.priority]}`];
    if (task.dueDate) {
      parts.push(`vence ${formatDate(task.dueDate)}${!task.completed && isOverdue(task) ? ' - VENCIDA' : ''}`);
    }
    return parts.join(', ');
  };

  // ── Texto plano ────────────────────────────────────────────────
  const textLines: string[] = ['Resumen de tus tareas', ''];
  if (tasks.length === 0) {
    textLines.push('No tenés tareas cargadas todavía.');
  } else {
    textLines.push(
      `Total: ${counts.total} | Pendientes: ${counts.pending} | Completadas: ${counts.completed} | Vencidas: ${counts.overdue}`,
      '',
    );
    if (pendingTasks.length > 0) {
      textLines.push('PENDIENTES');
      pendingTasks.forEach((task) => textLines.push(`- ${task.title} (${describe(task)})`));
      textLines.push('');
    }
    if (completedTasks.length > 0) {
      textLines.push('COMPLETADAS');
      completedTasks.forEach((task) => textLines.push(`- ${task.title}`));
    }
  }
  const text = textLines.join('\n').trimEnd();

  // ── HTML (todo el contenido del usuario va escapado) ───────────
  const listItems = (items: TaskRecord[], withDetails: boolean): string =>
    items
      .map((task) => {
        const detail = withDetails ? ` <span style="color:#6b7280">(${escapeHtml(describe(task))})</span>` : '';
        return `<li>${escapeHtml(task.title)}${detail}</li>`;
      })
      .join('');

  const body =
    tasks.length === 0
      ? '<p>No tenés tareas cargadas todavía.</p>'
      : `<p><strong>Total:</strong> ${counts.total} &nbsp;|&nbsp; <strong>Pendientes:</strong> ${counts.pending} &nbsp;|&nbsp; <strong>Completadas:</strong> ${counts.completed} &nbsp;|&nbsp; <strong>Vencidas:</strong> ${counts.overdue}</p>` +
        (pendingTasks.length > 0 ? `<h3>Pendientes</h3><ul>${listItems(pendingTasks, true)}</ul>` : '') +
        (completedTasks.length > 0 ? `<h3>Completadas</h3><ul>${listItems(completedTasks, false)}</ul>` : '');

  const html = `<!doctype html><html lang="es"><body style="font-family:Arial,Helvetica,sans-serif;color:#111827;max-width:600px"><h2>Resumen de tus tareas</h2>${body}</body></html>`;

  return { subject, text, html, counts };
}
