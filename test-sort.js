const axios = require('axios');

async function testSort() {
    const url = 'http://localhost:8080/api/products';
    
    // Try without sort
    let res = await axios.get(`${url}?page=0&size=5`);
    console.log("DEFAULT:");
    res.data.data.content.forEach(p => console.log(p.name));
    
    // Try sortBy=newest
    res = await axios.get(`${url}?page=0&size=5&sortBy=newest`);
    console.log("\nsortBy=newest:");
    res.data.data.content.forEach(p => console.log(p.name));

    // Try sortBy=createdAt,desc
    res = await axios.get(`${url}?page=0&size=5&sortBy=createdAt,desc`);
    console.log("\nsortBy=createdAt,desc:");
    res.data.data.content.forEach(p => console.log(p.name));

    // Try sort=createdAt,desc
    res = await axios.get(`${url}?page=0&size=5&sort=createdAt,desc`);
    console.log("\nsort=createdAt,desc:");
    res.data.data.content.forEach(p => console.log(p.name));
    
    // Try sort=id,desc
    res = await axios.get(`${url}?page=0&size=5&sort=id,desc`);
    console.log("\nsort=id,desc:");
    res.data.data.content.forEach(p => console.log(p.name));
}

testSort().catch(console.error);
