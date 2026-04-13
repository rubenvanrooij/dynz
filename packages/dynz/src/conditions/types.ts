export type RulesDependencyMap = {
  dependencies: Record<string, Set<string>>;
  reverse: Record<string, Set<string>>;
};
