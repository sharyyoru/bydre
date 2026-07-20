import { createClient } from '@supabase/supabase-js';

const OLD_SUPABASE_URL = process.env.OLD_SUPABASE_URL;
const OLD_SUPABASE_KEY = process.env.OLD_SUPABASE_KEY;
const NEW_SUPABASE_URL = process.env.SUPABASE_URL;
const NEW_SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!OLD_SUPABASE_URL || !OLD_SUPABASE_KEY || !NEW_SUPABASE_URL || !NEW_SUPABASE_KEY) {
  console.error('Missing environment variables');
  console.error('Required: OLD_SUPABASE_URL, OLD_SUPABASE_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY);
const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY);

async function migrateTasks() {
  console.log('Starting task migration (boards → projects, items → tasks)...');

  // Get all workspaces
  const { data: workspaces, error: wsError } = await oldSupabase
    .from('workspaces')
    .select('id, name');

  if (wsError) {
    console.error('Error fetching workspaces:', wsError);
    process.exit(1);
  }

  console.log(`Found ${workspaces.length} workspaces`);

  // Get all boards
  const { data: boards, error: boardError } = await oldSupabase
    .from('boards')
    .select('id, workspace_id, name, description');

  if (boardError) {
    console.error('Error fetching boards:', boardError);
    process.exit(1);
  }

  console.log(`Found ${boards.length} boards to migrate as projects`);

  // Get all items (tasks)
  const { data: items, error: itemError } = await oldSupabase
    .from('items')
    .select('id, board_id, title, description, priority, status, due_date, created_at, updated_at, parent_id')
    .is('parent_id', null); // Only top-level items

  if (itemError) {
    console.error('Error fetching items:', itemError);
    process.exit(1);
  }

  console.log(`Found ${items.length} items to migrate as tasks`);

  // Get item assignees
  const { data: assignees, error: assignError } = await oldSupabase
    .from('item_assignees')
    .select('item_id, user_id');

  if (assignError) {
    console.error('Error fetching assignees:', assignError);
    process.exit(1);
  }

  const assigneeMap = {};
  assignees.forEach(a => {
    if (!assigneeMap[a.item_id]) assigneeMap[a.item_id] = [];
    assigneeMap[a.item_id].push(a.user_id);
  });

  let projectsMigrated = 0;
  let tasksMigrated = 0;
  let failed = 0;

  // Migrate boards as projects
  for (const board of boards) {
    try {
      const { data: project, error: projectError } = await newSupabase
        .from('projects')
        .insert({
          name: board.name,
          description: board.description,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (projectError) {
        console.error(`Failed to create project from board ${board.name}:`, projectError.message);
        failed++;
        continue;
      }

      console.log(`✓ Created project: ${board.name}`);
      projectsMigrated++;

      // Migrate items as tasks for this board
      const boardItems = items.filter(i => i.board_id === board.id);

      for (const item of boardItems) {
        try {
          const assigneeIds = assigneeMap[item.id] || [];
          
          const { error: taskError } = await newSupabase
            .from('tasks')
            .insert({
              project_id: project.id,
              name: item.title,
              description: item.description,
              status: item.status || 'not_started',
              priority: item.priority || 'medium',
              due_date: item.due_date,
              created_at: item.created_at,
              updated_at: item.updated_at,
              metadata: {
                original_item_id: item.id,
                original_board_id: board.id,
                assignee_ids: assigneeIds,
              },
            });

          if (taskError) {
            console.error(`Failed to create task from item ${item.title}:`, taskError.message);
            failed++;
            continue;
          }

          tasksMigrated++;
        } catch (err) {
          console.error(`Error migrating item ${item.title}:`, err.message);
          failed++;
        }
      }
    } catch (err) {
      console.error(`Error migrating board ${board.name}:`, err.message);
      failed++;
    }
  }

  console.log(`\nMigration complete:`);
  console.log(`  Projects migrated: ${projectsMigrated}`);
  console.log(`  Tasks migrated: ${tasksMigrated}`);
  console.log(`  Failed: ${failed}`);
}

migrateTasks().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
