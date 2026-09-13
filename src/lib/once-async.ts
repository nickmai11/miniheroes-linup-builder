/** Share successful initialization across requests; failed attempts can retry. */
export function onceAsync<T>(initialize: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | undefined;
  return () => {
    pending ??= Promise.resolve()
      .then(initialize)
      .catch((error) => {
        pending = undefined;
        throw error;
      });
    return pending;
  };
}
