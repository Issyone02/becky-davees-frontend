const KEY = 'rolePreview:';

/** Remember, on THIS device only, which role color belongs to an identifier. */
export function rememberRoleTheme(identifier: string, role: string) {
  try {
    if (identifier) localStorage.setItem(KEY + identifier.trim().toLowerCase(), role);
  } catch { /* storage unavailable — ignore */ }
}

/** Preview the remembered role color while typing; neutral palette if unknown. */
export function previewRoleTheme(identifier: string) {
  const root = document.documentElement;
  try {
    const role = localStorage.getItem(KEY + (identifier ?? '').trim().toLowerCase());
    if (role) root.setAttribute('data-role', role);
    else root.removeAttribute('data-role');
  } catch {
    root.removeAttribute('data-role');
  }
}