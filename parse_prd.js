const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\28e749d9-1efb-4ff6-a924-71ae0bd0d9d2\\.system_generated\\logs\\overview.txt';

try {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  if (lines.length > 0) {
    const firstLineObj = JSON.parse(lines[0]);
    const prdText = firstLineObj.content;
    
    // Find all headings
    const headings = prdText.match(/^(#+.*)$/gm);
    console.log("=== HEADINGS ===");
    console.log(headings ? headings.join('\n') : "No headings found");
    
    // Print the entire text into a scratch file so we can view it
    fs.writeFileSync('E:\\Meridian\\FULL_PRD.md', prdText, 'utf8');
    console.log("\nSaved full PRD to E:\\Meridian\\FULL_PRD.md");
  }
} catch (err) {
  console.error("Error parsing log:", err);
}
