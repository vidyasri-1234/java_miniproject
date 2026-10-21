const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 8080;

// PostgreSQL Database Connection (Supabase Cloud)
const pool = new Pool({
  host: 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.qpeprwbpsjmjfkigknsu',
  password: 'Raj@Sonali@123',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// -----------------------------------------------------------------------------
// 1. Customer Parcel Tracking API (Matches Java AppServer /api/track format)
// -----------------------------------------------------------------------------
app.get('/api/track', async (req, res) => {
  const trackingId = (req.query.id || '').trim();

  if (!trackingId) {
    return res.status(400).json({ error: 'Keng Tracking ID uginn.' });
  }

  try {
    const parcelResult = await pool.query(
      'SELECT * FROM parcels WHERE LOWER(tracking_id) = LOWER($1)',
      [trackingId]
    );

    if (parcelResult.rows.length === 0) {
      return res.status(404).json({ found: false, trackingId });
    }

    const parcel = parcelResult.rows[0];

    const historyResult = await pool.query(
      'SELECT * FROM tracking_history WHERE LOWER(tracking_id) = LOWER($1) ORDER BY updated_at DESC',
      [parcel.tracking_id]
    );

    const history = historyResult.rows.map(h => ({
      status: h.status,
      location: h.location,
      remarks: h.remarks || '',
      updatedAt: h.updated_at ? new Date(h.updated_at).toLocaleString() : ''
    }));

    let expectedDeliveryDate = '';
    if (parcel.expected_delivery_date) {
      const d = new Date(parcel.expected_delivery_date);
      expectedDeliveryDate = d.toISOString().split('T')[0];
    }

    return res.status(200).json({
      found: true,
      trackingId: parcel.tracking_id,
      senderName: parcel.sender_name || 'N/A',
      receiverName: parcel.receiver_name || 'N/A',
      origin: parcel.origin || 'N/A',
      destination: parcel.destination || 'N/A',
      weightKg: parseFloat(parcel.weight_kg) || 0,
      currentStatus: parcel.current_status || 'Booked',
      currentLocation: parcel.current_location || 'Depot',
      expectedDeliveryDate,
      history
    });
  } catch (err) {
    console.error('Error in /api/track:', err);
    return res.status(500).json({ error: 'Database server error: ' + err.message });
  }
});

// -----------------------------------------------------------------------------
// 2. Admin Authentication API
// -----------------------------------------------------------------------------
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required.' });
  }

  try {
    const result = await pool.query(
      'SELECT user_id, username, role FROM users WHERE username = $1 AND password = $2',
      [username.trim(), password.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const user = result.rows[0];
    return res.json({ success: true, user: { username: user.username, role: user.role } });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ success: false, message: 'Database error: ' + err.message });
  }
});

// -----------------------------------------------------------------------------
// 3. Admin Parcel Management APIs (CRUD)
// -----------------------------------------------------------------------------
// Get all parcels with statistics
app.get('/api/admin/parcels', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM parcels ORDER BY created_at DESC');
    return res.json({ success: true, parcels: result.rows });
  } catch (err) {
    console.error('Error fetching parcels:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Add new parcel
app.post('/api/admin/parcels', async (req, res) => {
  const { trackingId, customerName, destination, location, status } = req.body;

  if (!trackingId || !customerName || !destination || !location) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert parcel
    await client.query(
      `INSERT INTO parcels (tracking_id, sender_name, receiver_name, origin, destination, weight_kg, current_status, current_location, expected_delivery_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE + INTERVAL '3 days')
       ON CONFLICT (tracking_id) DO UPDATE 
       SET current_status = EXCLUDED.current_status,
           current_location = EXCLUDED.current_location,
           receiver_name = EXCLUDED.receiver_name,
           destination = EXCLUDED.destination`,
      [trackingId.trim().toUpperCase(), 'Apex Express Depot', customerName.trim(), location.trim(), destination.trim(), 2.5, status || 'Booked', location.trim()]
    );

    // Insert history
    await client.query(
      `INSERT INTO tracking_history (tracking_id, status, location, remarks)
       VALUES ($1, $2, $3, $4)`,
      [trackingId.trim().toUpperCase(), status || 'Booked', location.trim(), 'Status updated via Admin Dashboard']
    );

    await client.query('COMMIT');
    return res.json({ success: true, message: 'Parcel saved successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error adding parcel:', err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// Delete parcel
app.delete('/api/admin/parcels/:trackingId', async (req, res) => {
  const trackingId = req.params.trackingId;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM tracking_history WHERE LOWER(tracking_id) = LOWER($1)', [trackingId]);
    await client.query('DELETE FROM parcels WHERE LOWER(tracking_id) = LOWER($1)', [trackingId]);
    await client.query('COMMIT');
    return res.json({ success: true, message: 'Parcel deleted successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting parcel:', err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// Root Route fallback
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start listening
const server = app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 Parcel Tracking & Management Server is LIVE!`);
  console.log(`📍 Web URL: http://localhost:${PORT}`);
  console.log(`📍 Customer Tracking: http://localhost:${PORT}/parcel-info.html`);
  console.log(`📍 Admin Login: http://localhost:${PORT}/admin-login.html`);
  console.log(`====================================================`);

  // Verify DB connection on startup
  try {
    const test = await pool.query('SELECT NOW()');
    console.log(`Connected to Supabase PostgreSQL at ${test.rows[0].now}`);
  } catch (e) {
    console.error(`Database connection warning:`, e.message);
  }
});

module.exports = { app, server };
