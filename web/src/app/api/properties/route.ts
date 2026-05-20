import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export async function GET() {
    try {
        // We point to the scraper's database file
        const dbPath = path.resolve(process.cwd(), '../scraper/properties.db');
        
        const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        // Ensure table exists just in case the API is called before the scraper finishes its first run
        await db.exec(`
            CREATE TABLE IF NOT EXISTS properties (
                id TEXT PRIMARY KEY,
                title TEXT,
                price REAL,
                condominio REAL,
                url TEXT,
                image TEXT,
                rooms INTEGER,
                bathrooms INTEGER,
                location TEXT,
                description TEXT,
                found_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const properties = await db.all('SELECT * FROM properties ORDER BY price ASC, found_at DESC');
        await db.close();

        return NextResponse.json(properties);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
    }
}
