// const express = require("express");
// const app = express();
// const bodyParser = require("body-parser");
// const mysql = require("mysql2");

// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());

// // Skapa en databaskoppling...
// async function getDBConnection() {
//   return mysql.createConnection({
//     host: "localhost",
//     user: "root",
//     password: "",
//     database: "db-users",
//   });
// }

// // POST endpoint för inloggning
// app.post("/login", async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     let connection = await getDBConnection();

//     // Hämta användaren från databasen baserat på användarnamn
//     const query = "SELECT * FROM users WHERE username = ?";
//     // console.log("Query:", query);
//     const result = await connection.execute(query, [username]);
//     // console.log("Result:", result);

//     const rows = result._rows; // Resultatet av SQL-frågan
//     if (rows.length > 0) {
//       const user = rows[0];
//       if (user.password === password) {
//         // Lösenordet matchar
//         res.status(200).json({ message: "Du är inloggad" });
//       } else {
//         // Fel lösenord
//         res.status(401).json({ message: "Fel lösenord" });
//       }
//     } else {
//       // Användaren finns inte
//       res.status(401).json({ message: "Användaren finns inte" });
//     }

//     connection.end();
//   } catch (error) {
//     console.error("Fel vid inloggning:", error);
//     res.status(500).json({ message: "Ett fel inträffade vid inloggning" });
//   }
// });

// // Starta servern
// const PORT = 3000;
// app.listen(PORT, () => {
//   console.log(`Servern är igång på port ${PORT}`);
// });

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Skapa en anslutningspool till databasen
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "första_databas",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const THESECRET = "secret of secrets"; // Definiera hemlig nyckel för att signera och verifiera JWT-token

// Middleware-funktion för att autentisera JWT-token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.slice(7); // Ta bort "Bearer " från tokensträngen

  if (token == null) {
    return res.status(401).send("Auth token missing.");
  }

  jwt.verify(token, THESECRET, (err, user) => {
    if (err) {
      console.error(err); // Logga fel för felsökning på servern
      return res.status(401).send("Invalid auth token");
    }
    req.user = user;
    next();
  });
}

// POST endpoint för inloggning
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Hämta en anslutning från poolen
    const connection = await pool.promise().getConnection();

    // Hämta användaren från databasen baserat på användarnamn
    const query = "SELECT * FROM users WHERE username = ?";
    const [rows] = await connection.execute(query, [username]);

    if (rows.length === 0) {
      // Användaren finns inte
      res.status(401).json({ message: "Användaren finns inte" });
    } else {
      const user = rows[0];
      if (user.password === password) {
        // Lösenordet matchar
        // Skapa en JWT-token med användarens ID och namn
        const payload = {
          sub: user.id,
          name: user.name,
        };
        const token = jwt.sign(payload, THESECRET);
        res.status(200).json({ token });
      } else {
        // Fel lösenord
        res.status(401).json({ message: "Fel lösenord" });
      }
    }

    // Släpp anslutningen tillbaka till poolen när den inte längre behövs
    connection.release();
  } catch (error) {
    console.error("Fel vid inloggning:", error);
    res.status(500).json({ message: "Ett fel inträffade vid inloggning" });
  }
});

// Route för att testa token
app.get("/auth-test", authenticateToken, (req, res) => {
  res.send(req.user); // Skickar tillbaka den avkodade, giltiga, tokenen.
});

// Starta servern
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servern är igång på port ${PORT}`);
});
