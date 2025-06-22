const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
require('dotenv').config();
const app = express();
const port = 4000;

app.use(bodyParser.json());

// DB Connection-Postgresql
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});
pool.connect()
    .then(() => console.log('Connected DB'))
    .catch(err => console.error('DB connection error:', err));

function parsePlatoons(line) {
    if (!line) return [];
    return line.split(';').map(entry => {
        const [unit, count] = entry.split('#');
        return { class: unit.trim(), count: parseInt(count.trim()) };
    });
}

// Calculate battle result (1 = win, 0 = draw, -1 = loss)
function effectivePower(own, enemy, advantageMap) {
    let ownCount = own.count;
    let enemyCount = enemy.count;

    if (advantageMap[own.class]?.includes(enemy.class)) {
        ownCount *= 2;
    }
    if (advantageMap[enemy.class]?.includes(own.class)) {
        enemyCount *= 2;
    }

    if (ownCount > enemyCount) return 1;
    if (ownCount === enemyCount) return 0;
    return -1;
}

// All permutations of array
function permute(arr) {
    if (arr.length === 1) return [arr];
    let result = [];

    for (let i = 0; i < arr.length; i++) {
        const current = arr[i];
        const rest = arr.slice(0, i).concat(arr.slice(i + 1));
        const perms = permute(rest);
        perms.forEach(p => result.push([current, ...p]));
    }

    return result;
}

app.post('/battle', async (req, res) => {
    const { ownPlatoons, enemyPlatoons } = req.body;

    if (!ownPlatoons || !enemyPlatoons) {
        return res.status(400).json({ msg: 'Invalid input: ownPlatoons and enemyPlatoons required' });
    }

    const own = parsePlatoons(ownPlatoons);
    const enemy = parsePlatoons(enemyPlatoons);

    if (own.length !== 5 || enemy.length !== 5) {
        return res.status(400).json({ msg: 'Exactly 5 platoons are required for both sides' });
    }

    // Fetch advantage map from DB
    let result;
    try {
        result = await pool.query('SELECT * FROM class_advantages');
    } catch (err) {
        console.error('Database error:', err);
        return res.status(500).json({ msg: 'Error querying database' });
    }

    const advantageMap = {};
    result.rows.forEach(row => {
        advantageMap[row.class] = row.advantages;
    });


    const preferredOrder = ['Militia', 'FootArcher', 'Spearmen', 'LightCavalry', 'HeavyCavalry'];
    const targetPerm = preferredOrder.map(cls => own.find(p => p.class === cls));
    const allPerms = [targetPerm, ...permute(own).filter(p => JSON.stringify(p) !== JSON.stringify(targetPerm))];

    for (const perm of allPerms) {
        let wins = 0;
        const battleLog = [];

        for (let i = 0; i < 5; i++) {
            const ownUnit = perm[i];
            const enemyUnit = enemy[i];
            const result = effectivePower(ownUnit, enemyUnit, advantageMap);

            let outcome = result === 1 ? "Win" : result === 0 ? "Draw" : "Loss";
            if (result === 1) wins++;

            battleLog.push({
                battle: i + 1,
                own: `${ownUnit.class}#${ownUnit.count}`,
                enemy: `${enemyUnit.class}#${enemyUnit.count}`,
                outcome
            });
        }

        if (wins >= 3) {
            return res.json({
                output: perm.map(p => `${p.class}#${p.count}`).join(';'),
                battleTable: battleLog
            });
        }
    }

    return res.json({
        msg: 'There is no chance of winning'
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});