const { execSync } = require('child_process');

function addEnv(name, value, envs) {
  const envArray = envs.split(',');
  for (const env of envArray) {
    try {
      execSync('npx vercel env rm ' + name + ' ' + env + ' -y', {stdio: 'ignore'});
    } catch(e) {}
  }
  
  try {
    console.log('Adding ' + name);
    execSync(`npx vercel env add ${name} ${envs} --value "${value}" --no-sensitive --yes`, { stdio: 'inherit' });
    console.log('Added ' + name);
  } catch(e) {
    console.error('Failed to add ' + name);
  }
}

addEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://thiftwzubmvcrdhuwcwm.supabase.co', 'production,preview,development');
addEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaWZ0d3p1Ym12Y3JkaHV3Y3dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMTIxNzIsImV4cCI6MjA5NDY4ODE3Mn0.ontxCxwCCA4TRbFCF9oZHT-eSDTrVC2b5P6z5B6Xa6s', 'production,preview,development');
addEnv('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaWZ0d3p1Ym12Y3JkaHV3Y3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTExMjE3MiwiZXhwIjoyMDk0Njg4MTcyfQ.otwtK4a9g6Nf4DON1QCkoERKueQ8YcbrCaS9Tv0xhC4', 'production,preview');
