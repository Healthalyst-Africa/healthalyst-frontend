export function createPlatformApiRewrites(properties: {
  browserAddress?: string;
  upstreamAddress?: string;
}): { source: string; destination: string }[];

export function createPlatformApiRewritesFromEnvironment(): {
  source: string;
  destination: string;
}[];
