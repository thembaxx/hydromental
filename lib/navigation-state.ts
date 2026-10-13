/** Let Next's native-history integration supply its own router bookkeeping. */
export function navigationState(extra: Record<string, unknown> = {}) {
  const state = { ...window.history.state };
  delete state.__NA;
  delete state._N;
  delete state.__PRIVATE_NEXTJS_INTERNALS_TREE;
  return { ...state, ...extra };
}
