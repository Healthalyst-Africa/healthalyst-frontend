type Rewrite = { source: string; destination: string };

export function createPlatformApiRewrites(properties: {
  browserAddress?: string;
  upstreamAddress?: string;
}): Rewrite[];

export function createPlatformApiRewritesFromEnvironment(): Rewrite[];

export function createProductApiRewrites(properties: {
  browserAddress?: string;
  browserVariableName: string;
  upstreamAddress?: string;
  upstreamVariableName: string;
}): Rewrite[];

export function createHealthScheduleApiRewritesFromEnvironment(): Rewrite[];
