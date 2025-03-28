import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const { rows } = await sql`
      SELECT 
        id,
        TO_CHAR(timestamp, 'YYYY-MM-DD HH24:MI:SS') as time,
        method,
        domain,
        path,
        client_ip
      FROM requests
      ORDER BY timestamp DESC
      LIMIT 100
    `;
    
    res.status(200).json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Database query failed' });
  }
}
