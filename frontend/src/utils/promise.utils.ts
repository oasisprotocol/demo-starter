function rejectDelay(reason: string) {
  return new Promise(function (_, reject) {
    setTimeout(reject.bind(null, reason), 5000);
  });
}

export async function retry<T extends Promise<any>>(
  attempt: () => T,
  tryCb: (value: Awaited<T>) => void = () => {},
  maxAttempts = 10,
): Promise<Awaited<() => T>> {
  let p: Promise<Awaited<typeof attempt>> = Promise.reject();

  for (let i = 0; i < maxAttempts; i++) {
    p = p
      .catch(attempt)
      .then((value) => {
        return tryCb(value);
      })
      .catch(rejectDelay) as Promise<Awaited<typeof attempt>>;
  }

  return p;
}
