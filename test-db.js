const mysql = require('mysql2/promise');

async function testConnection() {
    console.log('Testing database connection...');
    try {
        const connection = await mysql.createConnection({
            host: "218.255.186.126",
            port: 910,
            user: "mt4user",
            password: "dnadna",
            database: "golday_mt5_uat"
        });
        console.log('Successfully connected to the database!');
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('Failed to connect to the database:', error);
        process.exit(1);
    }
}

testConnection();
