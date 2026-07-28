export function validatePenaltyReason(reason: string): string | null {
  const normalizedReason = reason.trim();
  if (normalizedReason.length < 3) return 'Ingrese un motivo de al menos 3 caracteres.';
  if (normalizedReason.length > 500) return 'El motivo no puede superar los 500 caracteres.';
  return null;
}
