export function buildWhere(name: string | undefined, includeConfirmed: boolean) {
  return {
    name: name ? { contains: name, mode: 'insensitive' } : undefined,
    confirmedAt: includeConfirmed ? undefined : null,
  } as const satisfies Record<string, unknown>;
}

export const notMutated = { kind: 'cast' } as Readonly<{ kind: string }>;
