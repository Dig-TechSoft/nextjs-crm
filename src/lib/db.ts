import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: "218.255.186.126",
    port: 910,
    user: "mt4user",
    password: "dnadna",
    database: "golday_mt5_uat",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export default pool;
