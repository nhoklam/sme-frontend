const axios = require('axios');

async function testCreateAndSort() {
    try {
        const loginRes = await axios.post('http://localhost:8080/api/auth/login', {
            username: 'admin',
            password: 'password' // replace with actual or I will just fetch from db if I can
        });
        const token = loginRes.data.data.accessToken;
        
        // Let's just create a product
        await axios.post('http://localhost:8080/api/products', {
            name: "Z_Test New Product",
            isbnBarcode: "1234567890123",
            retailPrice: 100000,
            categoryId: "f47ac10b-58cc-4372-a567-0e02b2c3d479" // assuming random UUID won't work, need a real one
        }, { headers: { Authorization: `Bearer ${token}` }});
        
    } catch(e) {
        console.log("Error", e.message);
    }
}
testCreateAndSort();
