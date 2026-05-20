import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

let dbInstance: Database<sqlite3.Database, sqlite3.Statement> | null = null;

export async function getDb() {
    if (dbInstance) {
        return dbInstance;
    }

    dbInstance = await open({
        filename: './properties.db',
        driver: sqlite3.Database
    });

    await dbInstance.exec(`
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

    return dbInstance;
}

export interface Property {
    id: string;
    title: string;
    price: number;
    condominio: number;
    url: string;
    image: string;
    rooms: number;
    bathrooms: number;
    location: string;
    description: string;
}

export async function saveProperty(property: Property) {
    const db = await getDb();
    
    await db.run(
        `INSERT OR REPLACE INTO properties (id, title, price, condominio, url, image, rooms, bathrooms, location, description, found_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
            property.id, 
            property.title, 
            property.price, 
            property.condominio,
            property.url, 
            property.image, 
            property.rooms, 
            property.bathrooms, 
            property.location,
            property.description
        ]
    );
}

export async function getProperties(): Promise<Property[]> {
    const db = await getDb();
    return db.all<Property[]>('SELECT * FROM properties ORDER BY found_at DESC');
}
