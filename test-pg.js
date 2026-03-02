// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        
        // Let's get the appointments starting from today
        const query = `
            SELECT id, "startTime", "locationId", "isFree", "barberId"
            FROM "Appointment"
            WHERE "startTime" >= NOW()
            ORDER BY "startTime" ASC
            LIMIT 10;
        `;
        
        const res = await client.query(query);
        console.log("Next 10 upcoming appointments from raw PostgreSQL:");
        console.log(JSON.stringify(res.rows, null, 2));

        const countRes = await client.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN "locationId" IS NULL THEN 1 ELSE 0 END) as missing_location
            FROM "Appointment"
            WHERE "startTime" >= NOW()
        `);
        console.log("Stats for upcoming appointments:", countRes.rows[0]);

    } catch (e) {
        console.error("DB Error:", e);
    } finally {
        await client.end();
    }
}

main();
