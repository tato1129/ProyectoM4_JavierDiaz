/**
 * Tipos mínimos de request/response. Son compatibles estructuralmente con
 * VercelRequest/VercelResponse, pero permiten testear el handler sin depender de Vercel.
 */
export interface ApiRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
}

export interface ApiResponse {
  status(code: number): ApiResponse;
  json(body: unknown): unknown;
  setHeader(name: string, value: string): unknown;
}

export interface TaskRecord {
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  /** YYYY-MM-DD o null */
  dueDate: string | null;
  order: number;
}

export interface VerifiedUser {
  uid: string;
  email: string | null;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/** Dependencias externas del handler (inyectadas para poder mockearlas en los tests). */
export interface SendSummaryDeps {
  verifyToken(token: string): Promise<VerifiedUser>;
  /** Devuelve false si el usuario ya envió un resumen hace muy poco. */
  acquireCooldown(uid: string): Promise<boolean>;
  fetchTasks(uid: string): Promise<TaskRecord[]>;
  sendEmail(params: SendEmailParams): Promise<void>;
}
