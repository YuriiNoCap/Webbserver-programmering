const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

// Inställningar av servern.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const mysql = require("mysql2");
async function getDBConnnection() {
  return mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "första_databas",
  });
}

function isValidUserData(body) {
  return (
    body && typeof body.username === "string" && typeof body.name === "string"
  );
}

// KRAV NIVÅ 1 (GET /resurs - returnerar en lista av alla resurser)
app.get("/users", async function (req, res) {
  let connection = await getDBConnnection();
  let sql = `SELECT * from users`;

  try {
    const [results] = await connection.promise().query(sql);
    res.json(results);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    connection.end();
  }
});

// KRAV NIVÅ 1 (GET /resurs/:id - returnerar en resurs angivet av det id som angivits.)
app.get("/users/:id", async (req, res) => {
  const userId = req.params.id;

  if (!userId || isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  let connection;
  try {
    connection = await getDBConnnection();
    const [results] = await connection
      .promise()
      .query("SELECT * FROM users WHERE id = ?", [userId]);

    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(results[0]);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (connection) {
      connection.end();
    }
  }
});

// KRAV NIVÅ 1 (POST /resurs - skapar en ny resurs. En resurs ska se ut så här: { “hello”: “world”, ... })
app.post("/users", async function (req, res) {
  if (!isValidUserData(req.body)) {
    return res.status(422).json({ error: "Invalid user data." });
  }

  const { username, name } = req.body;

  try {
    let connection = await getDBConnnection();
    let sql = `INSERT INTO users (username, name)
  VALUES (?, ?)`;
    let results = connection.execute(sql, [username, name]);
    let insertedId = results.insertId;

    sql = `SELECT * FROM users WHERE id = ?`;
    let user = connection.execute(sql, [insertedId]);

    console.log(user);

    res.json(user[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// KRAV NIVÅ 2 (PUT /resurs/id - för att uppdatera befintlig resurs)
app.put("/users/:id", async (req, res) => {
  const userId = req.params.id;

  if (!userId || isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  if (!isValidUserData(req.body)) {
    return res.status(422).json({ error: "Invalid user data" });
  }

  const { username, name, password, email } = req.body;

  try {
    let connection = await getDBConnnection();
    const sql = `UPDATE users SET username = ?, name = ?, password = ?, email = ? WHERE id = ?`;
    await connection
      .promise()
      .execute(sql, [username, name, password, email, userId]);

    const updatedUser = await connection
      .promise()
      .query("SELECT * FROM users WHERE id = ?", [userId]);
    connection.end();

    if (updatedUser[0].length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedUser[0][0]);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// KRAV NIVÅ 2???, 3[TOKEN]??? (POST /login)
// app.post("/login", async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     let connection = await getDBConnnection();

//     let sql = "SELECT * FROM users WHERE username = ?";
//     let result = await connection.execute(sql, [username]);

//     if (!result || result.length === 0) {
//       console.log("no");
//     } else {
//       console.log(result);
//     }

//     if (Array.isArray(result._rows) && result._rows.length > 0) {
//       const user = result._rows[0];
//       const hashedPasswordFromDB = user.password;

//       const isPasswordValid = await bcrypt.compare(
//         password,
//         hashedPasswordFromDB
//       );

//       if (isPasswordValid) {
//         const userWithoutPassword = { ...user };
//         delete userWithoutPassword.password;
//         res.status(200).json(userWithoutPassword);
//       } else {
//         res.status(401).json({ error: "Invalid credentialsss" });
//       }
//     } else {

//       res.status(401).json({ error: "Invaliddd credentials" });
//     }
//   } catch (error) {
//     console.error("Error logging in:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// ''''''''''''''''''''''''''''''''''''''

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send("Användarnamn och lösenord krävs.");
  }

  try {
    let connection = await getDBConnnection();

    const query = `SELECT * FROM users WHERE username = ? `;
    // console.log(test);
    // console.log([username]);
    const result = connection.execute(query, [username]);
    console.log(result);
    // console.log(result);
    if (result.length > 0) {
      const user = result[0];
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        res.send("Inloggning lyckades!");
      } else {
        res.status(401).send("Felaktigt lösenord.");
      }
    } else {
      res.status(404).send("Användaren hittades inte.");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Serverfel: " + error.message);
  } finally {
    connection.end();
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
