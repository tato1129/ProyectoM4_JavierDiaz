import { describe, expect, it } from 'vitest';
import { buildSummary, escapeHtml } from '../../functions/lib/summary';
import type { TaskRecord } from '../../functions/types';

const today = new Date(2026, 10, 17); // 17/11/2026

const tasks: TaskRecord[] = [
  { title: 'Pagar <b>alquiler</b>', description: '', completed: false, priority: 'high', dueDate: '2026-11-10', order: 1 },
  { title: 'Llamar al médico', description: '', completed: false, priority: 'low', dueDate: null, order: 2 },
  { title: 'Enviar informe', description: '', completed: true, priority: 'medium', dueDate: '2026-11-01', order: 3 },
];

describe('buildSummary', () => {
  it('cuenta total, pendientes, completadas y vencidas', () => {
    expect(buildSummary(tasks, today).counts).toEqual({ total: 3, completed: 1, pending: 2, overdue: 1 });
  });

  it('arma un asunto con singular y plural correctos', () => {
    expect(buildSummary(tasks, today).subject).toBe('Resumen de tus tareas: 2 pendientes y 1 completada');
  });

  it('escapa el HTML escrito por el usuario', () => {
    const { html } = buildSummary(tasks, today);
    expect(html).not.toContain('<b>alquiler</b>');
    expect(html).toContain('&lt;b&gt;alquiler&lt;/b&gt;');
  });

  it('incluye en el texto plano el vencimiento formateado y marca las vencidas', () => {
    const { text } = buildSummary(tasks, today);
    expect(text).toContain('10/11/2026');
    expect(text).toContain('VENCIDA');
    expect(text).toContain('Enviar informe');
  });

  it('lista primero las pendientes de mayor prioridad', () => {
    const { text } = buildSummary(tasks, today);
    expect(text.indexOf('Pagar')).toBeLessThan(text.indexOf('Llamar al médico'));
  });

  it('maneja la lista vacía', () => {
    const summary = buildSummary([], today);
    expect(summary.counts.total).toBe(0);
    expect(summary.text).toMatch(/no tenés tareas/i);
    expect(summary.html).toMatch(/no tenés tareas/i);
  });
});

describe('escapeHtml', () => {
  it('escapa los caracteres especiales', () => {
    expect(escapeHtml(`<a href="x">Tom & 'Jerry'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;',
    );
  });
});
