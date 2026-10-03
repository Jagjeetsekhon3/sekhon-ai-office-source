/** Legacy names are migrated only when they exactly match an inherited default.
 * Durable IDs, sessions, avatar keys and custom names are kept intact. */
const LEGACY_NAMES: Record<string, string> = {
  michael: 'Sekhon Manager', jim: 'Business Lead', pam: 'Creative Director',
  dwight: 'Studio Manager', kevin: 'Accountant', angela: 'Finance Lead',
  oscar: 'Business Analyst', stanley: 'Sales Lead', phyllis: 'Client Relations',
  andy: 'Marketing Lead', kelly: 'Customer Support', ryan: 'Research Assistant',
  toby: 'People Operations', creed: 'Quality Lead', meredith: 'Supplier Relations',
};
export function sekhonAgentName(name: string): string {
  return LEGACY_NAMES[name.trim().toLowerCase()] ?? name;
}
export function migrateSekhonAgent<T extends { name: string }>(agent: T): T {
  const name = sekhonAgentName(agent.name);
  return name === agent.name ? agent : { ...agent, name };
}
