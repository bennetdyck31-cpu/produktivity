const express = require('express')
const { Pool } = require('pg')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({ origin: ['http://localhost:1000', 'http://localhost:5173', 'http://localhost:3000'] }))
app.use(express.json())

// PostgreSQL Verbindung
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})

// ─────────────────────────────────────────────
// GET /api/tasks — Alle Aufgaben abrufen
// ─────────────────────────────────────────────
app.get('/api/tasks', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM tasks ORDER BY deadline ASC'
        )
        res.json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Datenbankfehler beim Abrufen der Aufgaben' })
    }
})

// ─────────────────────────────────────────────
// POST /api/tasks — Neue Aufgabe erstellen
// ─────────────────────────────────────────────
app.post('/api/tasks', async (req, res) => {
    const { title, description, category, priority, deadline, status } = req.body

    if (!title || !deadline) {
        return res.status(400).json({ error: 'Titel und Deadline sind Pflichtfelder' })
    }

    try {
        const result = await pool.query(
            `INSERT INTO tasks (title, description, category, priority, deadline, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [title, description || null, category || 'Sonstiges', priority || 'Mittel', deadline, status || 'Offen']
        )
        res.status(201).json(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Datenbankfehler beim Erstellen der Aufgabe' })
    }
})

// ─────────────────────────────────────────────
// PATCH /api/tasks/:id — Aufgabe aktualisieren
// ─────────────────────────────────────────────
app.patch('/api/tasks/:id', async (req, res) => {
    const { id } = req.params
    const { title, description, category, priority, deadline, status, completed } = req.body

    try {
        const result = await pool.query(
            `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           priority = COALESCE($4, priority),
           deadline = COALESCE($5, deadline),
           status = COALESCE($6, status),
           completed = COALESCE($7, completed),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
            [title, description, category, priority, deadline, status, completed, id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Aufgabe nicht gefunden' })
        }

        res.json(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Datenbankfehler beim Aktualisieren der Aufgabe' })
    }
})

// ─────────────────────────────────────────────
// DELETE /api/tasks/:id — Aufgabe löschen
// ─────────────────────────────────────────────
app.delete('/api/tasks/:id', async (req, res) => {
    const { id } = req.params

    try {
        const result = await pool.query(
            'DELETE FROM tasks WHERE id = $1 RETURNING *',
            [id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Aufgabe nicht gefunden' })
        }

        res.json({ message: 'Aufgabe gelöscht', task: result.rows[0] })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Datenbankfehler beim Löschen der Aufgabe' })
    }
})

// ─────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }))

// Server starten
app.listen(PORT, () => {
    console.log(`TaskGrid API läuft auf http://localhost:${PORT}`)
})
