export interface SeedStandaloneLead {
  name: string | null;
  email: string;
  daysAgo: number;
}

// Extra leads not tied to a specific seeded conversation (e.g. captured via
// the widget on a day we didn't script a full transcript for) -- rounds out
// the leads list to a realistic count for the dashboard.
export const standaloneLeads: SeedStandaloneLead[] = [
  { name: "Sofia Reyes", email: "sofia.reyes@gmail.com", daysAgo: 6 },
  { name: null, email: "hquinn87@yahoo.com", daysAgo: 9 },
  { name: "Ben Okafor", email: "ben.okafor@outlook.com", daysAgo: 12 },
  { name: "Meredith Chu", email: "meredith.chu@icloud.com", daysAgo: 13 },
];
