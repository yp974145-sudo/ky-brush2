// merge_questions.js - 用 Node.js 合并所有 data-*.js 文件
const fs = require('fs');
const path = require('path');

const JS_DIR = '../408-brush/js';
const OUT_DIR = './data';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, {recursive:true});

const GROUPS = {
  '408': ['ds','co','os','cn'],
  'math': ['ma1','ma2','ma3'],
  'politics': ['po'],
  'english': ['en1','en2','english1','english2'],
};

const allQuestions = { '408':[], 'math':[], 'politics':[], 'english':[] };
const files = fs.readdirSync(JS_DIR).filter(f => f.startsWith('data-') && f.endsWith('.js'));

for (const fname of files.sort()) {
  // Clear module cache to avoid conflicts
  const fpath = path.resolve(JS_DIR, fname);
  delete require.cache[fpath];
  
  try {
    // Execute the JS file to get the variable
    const content = fs.readFileSync(fpath, 'utf8');
    // Extract variable name
    const varMatch = content.match(/const\s+(\w+)\s*=/);
    if (!varMatch) continue;
    const varName = varMatch[1];
    
    // Use eval to execute the file and get the array
    let arr;
    eval(content + `; arr = ${varName};`);
    
    if (!Array.isArray(arr)) continue;
    
    let count = 0;
    for (const q of arr) {
      if (!q.question || q.question.length < 3) continue;
      const subj = q.subject || '';
      
      let group = null;
      for (const [g, subjects] of Object.entries(GROUPS)) {
        if (subjects.includes(subj)) { group = g; break; }
      }
      
      if (group) {
        // Normalize subject
        if (subj === 'en1') q.subject = 'english1';
        if (subj === 'en2') q.subject = 'english2';
        allQuestions[group].push(q);
        count++;
      }
    }
    
    if (count) console.log(`${fname}: ${count} questions`);
  } catch(e) {
    // Skip parse errors silently
  }
}

// Write merged files
let total = 0;
for (const [group, qs] of Object.entries(allQuestions)) {
  const outPath = path.join(OUT_DIR, `questions-${group}.js`);
  const content = `// Auto-merged ${group} questions\nconst QUESTIONS_${group.toUpperCase()} = ` 
    + JSON.stringify(qs).replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029') + ';\n';
  fs.writeFileSync(outPath, content, 'utf8');
  console.log(`\n${group}: ${qs.length} questions -> ${outPath}`);
  total += qs.length;
}

console.log(`\nTOTAL: ${total} questions in ${Object.keys(allQuestions).length} files`);
