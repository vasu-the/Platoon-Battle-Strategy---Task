A Node.js + Express + PostgreSQL REST API that simulates a Platoon Battle Strategy. It determines the best arrangement of your army to win "at least 3 out of 5" platoon battles against an opponent, factoring in soldier counts and class advantages.

---

## Problem Statement

- Each player (you and your opponent) has 5 platoons.
- Each platoon consists of a "class" and a "number of soldiers" (e.g., `Militia#30`).
- Some classes have advantages over others.
- If your platoon has an advantage over the enemy's, it fights with "2x effectiveness".
- Goal: "Find an arrangement of your platoons" that beats the opponent in "at least 3 out of 5 battles"

---

# Classes & Advantages

| Class            | Advantage Over                              |
|------------------|---------------------------------------------|
| Militia          | Spearmen, LightCavalry                      |
| Spearmen         | LightCavalry, HeavyCavalry                  |
| LightCavalry     | FootArcher, CavalryArcher                   |
| HeavyCavalry     | Militia, FootArcher, LightCavalry           |
| CavalryArcher    | Spearmen, HeavyCavalry                      |
| FootArcher       | Militia, CavalryArcher                      |

---

## Start

1.Clone the repo

```bash
git clone https://github.com/vasu-the/Platoon-Battle-Strategy---Task.git
cd Platoon-Battle-Strategy---Task

2.Install dependencies

npm install


3. Set up PostgreSQL

Create a database ,

CREATE DATABASE battle_db;

\c battle_db

CREATE TABLE class_advantages (
  class TEXT PRIMARY KEY,
  advantages TEXT[]
);

INSERT INTO class_advantages (class, advantages) VALUES
('Militia', ARRAY['Spearmen', 'LightCavalry']),
('Spearmen', ARRAY['LightCavalry', 'HeavyCavalry']),
('LightCavalry', ARRAY['FootArcher', 'CavalryArcher']),
('HeavyCavalry', ARRAY['Militia', 'FootArcher', 'LightCavalry']),
('CavalryArcher', ARRAY['Spearmen', 'HeavyCavalry']),
('FootArcher', ARRAY['Militia', 'CavalryArcher']);
Update database credentials in your index.js:

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'battle_db',
  password: 'your_password',
  port: 5432,
});


4. Run the server

npm run dev

API available at: http://localhost:4000

POST /battle

Request:
raw-json
body

{
  "ownPlatoons": "Spearmen#10;Militia#30;FootArcher#20;LightCavalry#1000;HeavyCavalry#120",
  "enemyPlatoons": "Militia#10;Spearmen#10;FootArcher#1000;LightCavalry#120;CavalryArcher#100"
}

Response:

{
  "output": "Militia#30;FootArcher#20;Spearmen#10;LightCavalry#1000;HeavyCavalry#120",
  "battleTable": [
    { "battle": 1, "own": "Militia#30", "enemy": "Militia#10", "outcome": "Win" },
    { "battle": 2, "own": "FootArcher#20", "enemy": "Spearmen#10", "outcome": "Win" },
    { "battle": 3, "own": "Spearmen#10", "enemy": "FootArcher#1000", "outcome": "Loss" },
    { "battle": 4, "own": "LightCavalry#1000", "enemy": "LightCavalry#120", "outcome": "Win" },
    { "battle": 5, "own": "HeavyCavalry#120", "enemy": "CavalryArcher#100", "outcome": "Loss" }
  ]
}


Failure Case:

{ "message": "There is no chance of winning" }
