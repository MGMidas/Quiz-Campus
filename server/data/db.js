const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "quizmaster",
    waitForConnections: true,
    connectionLimit: 25,
});

async function initDB() {
    const conn = await pool.getConnection();
    try {
        await conn.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL
            )
        `);
        await conn.execute(`
            CREATE TABLE IF NOT EXISTS quizzes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                userId INT NOT NULL,
                titre VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        try {
            await conn.execute(`ALTER TABLE quizzes DROP COLUMN questions`);
        } catch {}
        try {
            await conn.execute(`CREATE INDEX idx_quizzes_userId ON quizzes(userId)`);
        } catch {}
        await conn.execute(`
            CREATE TABLE IF NOT EXISTS questions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                quizId INT NOT NULL,
                texte VARCHAR(500) NOT NULL,
                timer INT NOT NULL DEFAULT 30,
                bonne_reponse INT NOT NULL DEFAULT 0,
                ordre INT NOT NULL DEFAULT 0,
                FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE
            )
        `);
        await conn.execute(`
            CREATE TABLE IF NOT EXISTS reponses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                questionId INT NOT NULL,
                texte VARCHAR(200) NOT NULL,
                reponse_index INT NOT NULL DEFAULT 0,
                FOREIGN KEY (questionId) REFERENCES questions(id) ON DELETE CASCADE
            )
        `);
        try {
            await conn.execute(`CREATE INDEX idx_questions_quizId ON questions(quizId)`);
        } catch {}
        try {
            await conn.execute(`CREATE INDEX idx_reponses_questionId ON reponses(questionId)`);
        } catch {}
        console.log("Base MariaDB connectée et tables prêtes.");
    } finally {
        conn.release();
    }
}

module.exports = { pool, initDB };
