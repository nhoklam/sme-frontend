const axios = require('axios');

async function testSort() {
    const url = 'http://localhost:8080/api/products';
    
    const paramsList = [
        { sortBy: 'createdAt', sortDir: 'desc' },
        { sort: 'createdAt', direction: 'desc' },
        { sort_by: 'createdAt', order: 'desc' },
        { sortBy: 'createdAt', sortDirection: 'desc' },
        { orderBy: 'createdAt', orderDir: 'desc' },
    ];

    for (const params of paramsList) {
        console.log(`\nTESTING: ${JSON.stringify(params)}`);
        try {
            const res = await axios.get(url, { params: { ...params, page: 0, size: 5 } });
            res.data.data.content.forEach(p => console.log(p.name));
        } catch(e) {
            console.log("ERROR");
        }
    }
}

testSort().catch(console.error);
