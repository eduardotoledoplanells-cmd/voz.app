import { getVideos } from './src/lib/db';
getVideos().then(v => console.log(JSON.stringify(v[0], null, 2))).catch(console.error);
