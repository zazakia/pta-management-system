// Legacy seed file - replaced with Supabase migrations
// This file is kept for compatibility but not used

async function createStripeProducts() {
  console.log('Stripe products creation not implemented in Supabase version');
  // Placeholder for Stripe product creation
  return [];
}

async function createTeam(name: string, userEmail: string) {
  console.log('Team creation not implemented in Supabase version');
  // Placeholder for team creation
  return null;
}

export async function seed() {
  console.log('Database seeding not implemented in Supabase version');
  console.log('Use pnpm db:seed for Supabase-specific seeding');
}

export { createStripeProducts, createTeam };