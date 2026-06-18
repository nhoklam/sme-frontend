const fs = require('fs');
const code = fs.readFileSync('d:/DATN/bookstore-sales-management/src/modules/admin/pages/products/ProductListPage.tsx', 'utf8');
const lines = code.split('\n');
lines.forEach((line, i) => {
    if (line.includes('isManager')) {
        console.log(`${i+1}: ${line}`);
    }
});
