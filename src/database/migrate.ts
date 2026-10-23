// CLI: `npm run db:migrate -- up|down|pending|executed`
import { migrator } from './migrator';

void migrator.runAsCLI();
