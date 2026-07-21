import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupDRECompany() {
  console.log('🏢 Setting up DRE company and projects...\n');

  try {
    // Create DRE company
    console.log('Creating DRE company...');
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: 'DRE',
        legal_name: 'DRE Homes',
        industry: 'Real Estate',
        country: 'UAE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (companyError) {
      console.error('❌ Error creating company:', companyError.message);
      process.exit(1);
    }

    console.log(`✅ DRE company created (ID: ${company.id})`);

    // Create three projects under DRE
    const projectNames = ['Shoots', 'Content Creation', 'Graphics Tasks'];
    const projects = [];

    for (const projectName of projectNames) {
      console.log(`\nCreating project: ${projectName}...`);
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          company_id: company.id,
          name: projectName,
          description: `${projectName} project for DRE`,
          status: 'active',
          pipeline: 'default',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (projectError) {
        console.error(`❌ Error creating project ${projectName}:`, projectError.message);
        continue;
      }

      projects.push(project);
      console.log(`✅ Project created: ${projectName} (ID: ${project.id})`);
    }

    console.log('\n📊 Summary:');
    console.log(`   Company: DRE (ID: ${company.id})`);
    console.log(`   Projects created: ${projects.length}`);
    projects.forEach(p => {
      console.log(`      - ${p.name} (ID: ${p.id})`);
    });

    // Save IDs to a file for reference
    const config = {
      company_id: company.id,
      projects: projects.reduce((acc, p) => {
        acc[p.name] = p.id;
        return acc;
      }, {}),
    };

    console.log('\n✅ DRE company and projects setup complete!');
    console.log('\nConfiguration:');
    console.log(JSON.stringify(config, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

setupDRECompany();
