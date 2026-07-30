import type { LoginResponse } from '../types/auth.types';

type SessionListener = (session: LoginResponse | null) => void;
type SessionPersistence = (session: LoginResponse | null) => Promise<void>;

let currentSession: LoginResponse | null = null;
let persistence: SessionPersistence | null = null;
const listeners = new Set<SessionListener>();

export function getRuntimeSession() {
  return currentSession;
}

export function replaceRuntimeSession(session: LoginResponse | null) {
  currentSession = session;
  listeners.forEach((listener) => listener(session));
}

export async function updateRuntimeSession(session: LoginResponse | null) {
  if (persistence) {
    await persistence(session);
    return;
  }
  replaceRuntimeSession(session);
}

export function configureSessionPersistence(handler: SessionPersistence) {
  persistence = handler;
}

export function subscribeToSession(listener: SessionListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
