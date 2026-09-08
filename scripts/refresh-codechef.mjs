// Official-profile snapshot refresh. No third-party rating API or guessed data.
// A blocked request or changed markup leaves the last verified snapshot intact.
import fs from 'node:fs';
const source='https://www.codechef.com/users/true_field_64';
try {
  const response=await fetch(source,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error(`CodeChef returned HTTP ${response.status}`);
  const html=await response.text();
  if(!html.includes('true_field_64'))throw new Error('Profile identity could not be verified');
  const numbers=[...html.matchAll(/class="rating-number"[^>]*>\s*(\d+)/g)].map(m=>Number(m[1]));
  const division=Number(html.match(/\(Div\s+(\d+)\)/)?.[1]);
  const starBlock=html.match(/class="rating-star"[^>]*>([\s\S]*?)<\/div>/)?.[1]||'';
  const stars=(starBlock.match(/★|&#9733;|&#x2605;/gi)||[]).length;
  const ranksBlock=html.match(/class="rating-ranks"[^>]*>([\s\S]*?)<\/ul>/)?.[1]||'';
  const ranks=[...ranksBlock.matchAll(/<strong>\s*(\d+)\s*<\/strong>/g)].map(m=>Number(m[1]));
  const highestRating=Number(html.match(/Highest Rating\s+(\d+)/)?.[1]);
  if(numbers.length<2||!division||!stars||stars>7||ranks.length!==2||!highestRating)throw new Error('Profile markup changed; refusing to overwrite verified data');
  const data={handle:'true_field_64',rating:numbers[0],stars,division,highestRating,globalRank:ranks[0],countryRank:ranks[1],dsaRating:numbers[1],verifiedAt:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),source};
  fs.writeFileSync('src/data/codechef-snapshot.json',JSON.stringify(data,null,2)+'\n');
  fs.writeFileSync('research/codechef-latest.html',html);
  console.log('Verified CodeChef snapshot updated:',data);
} catch(error){console.error(error.message+'; existing verified snapshot preserved.');process.exitCode=1;}
