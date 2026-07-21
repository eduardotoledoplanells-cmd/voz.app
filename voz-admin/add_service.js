const { execSync } = require('child_process');
try { execSync('npx vercel env rm SUPABASE_SERVICE_ROLE_KEY production -y', {stdio: 'ignore'}); } catch(e){}
try { execSync('npx vercel env add SUPABASE_SERVICE_ROLE_KEY production,preview --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaWZ0d3p1Ym12Y3JkaHV3Y3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTExMjE3MiwiZXhwIjoyMDk0Njg4MTcyfQ.otwtK4a9g6Nf4DON1QCkoERKueQ8YcbrCaS9Tv0xhC4" --yes', { stdio: 'inherit' }); } catch(e){}
