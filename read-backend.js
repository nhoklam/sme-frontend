const fs = require('fs');
const code = fs.readFileSync('d:/DATN/sme-backend-1-main/src/main/java/sme/backend/controller/HomeBannerController.java', 'utf8');
const lines = code.split('\n');
console.log(lines.slice(20, 30).join('\n'));
