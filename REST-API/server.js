const express = require("express");
const app = express();

// parse application/json, för att hantera att man POSTar med JSON
const bodyParser = require("body-parser");

// Inställningar av servern.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Skapa en databaskoppling...

const mysql = require("mysql2");

// Creating a database connection object with settings to connect to the server and database.
async function getDBConnnection() {
  return mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "första_databas",
  });
}

// Function to validate user data
function isValidUserData(body) {
  return (
    body && typeof body.username === "string" && typeof body.name === "string"
  );
}

app.get("/", (req, res) => {
  res.send(`Hello world`);
});

app.get("/userss", (req, res) => {
  // Hårdkodad lista med användare
  const users = [
    { id: 1, name: "Martin" },
    { id: 2, name: "Martin Loman" },
  ];

  res.json(users);
});

// Testa att skapa en route som läser av route-parametrar och returnerar dem.
// (http://localhost:3000/user/1/Martin)

app.get("/user/:id/:name", (req, res) => {
  const userId = req.params.id;
  const userName = req.params.name;

  res.json({
    id: userId,
    name: userName,
  });
});

// Testa att skapa en route som läser av query-parametrar och returnerar dem.
// (http://localhost:3000/query-example?param1=value1&param2=value2)

app.get("/query-example", (req, res) => {
  const queryParam1 = req.query.param1;
  const queryParam2 = req.query.param2;

  res.json({
    param1: queryParam1,
    param2: queryParam2,
  });
});

// Testa att skapa en route som läser av query-parametrar och returnerar dem.
// Exempel (http://localhost:3000/product-info)

app.get("/product-info", (req, res) => {
  const productId = req.query.productId;
  const category = req.query.category;

  // Simulerad produktinformation baserat på query-parametrarna
  const productInfo = {
    productId: productId,
    category: category,
    productName: "Example Product",
    price: 19.99,
  };

  res.json(productInfo);
});

app.get("/users", async function (req, res) {
  let connection = await getDBConnnection();
  let sql = `SELECT * from users`;

  try {
    const [results] = await connection.promise().query(sql);

    // res.json() sends the result as JSON to the client
    res.json(results);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    // Always release the connection when done with it
    connection.end();
  }
});

/*
  app.post() hanterar en http request med POST-metoden.
*/
app.post("/users", async function (req, res) {
  // Data som postats till routen ligger i body-attributet på request-objektet.

  if (!isValidUserData(req.body)) {
    return res.status(422).json({ error: "Invalid user data." });
  }

  const { username, first_name } = req.body;

  try {
    // POST ska skapa något så här kommer det behövas en INSERT
    let connection = await getDBConnnection();
    let sql = `INSERT INTO users (username, name)
  VALUES (?, ?)`;
    let results = connection.execute(sql, [req.body.username, req.body.name]);
    // Hämta det id som skapades i databasen
    let insertedId = results.insertId;

    // Hämta den sparade användaren från databasen för att inkludera id i responsen
    sql = `SELECT * FROM users WHERE id = ?`;
    let user = connection.execute(sql, [insertedId]);

    //results innehåller metadata om vad som skapades i databasen

    console.log(user);

    res.json(user[0]); // Returnerar det skapade objektet som JSON
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/users/:id", async function (req, res) {
  try {
    const userId = parseInt(req.params.id);

    // Hämta en anslutning från getDBConnection-funktionen
    const connection = await getDBConnnection();

    // Kontrollera om användaren med det angivna id:t finns i databasen
    const [userExists] = await connection.execute(
      "SELECT id FROM users WHERE id = ?",
      [userId]
    );

    if (!userExists || userExists.length === 0) {
      await connection.end(); // Stäng anslutningen om användaren inte finns
      return res.status(400).send("User not found.");
    }

    // Utför uppdateringen i databasen
    const sql = `UPDATE users SET first_name = ?, last_name = ? WHERE id = ?`;
    await connection.execute(sql, [
      req.body.first_name,
      req.body.last_name,
      userId,
    ]);

    // Stäng anslutningen när uppdateringen är klar
    await connection.end();

    // Returnera 200 OK om allt går bra
    return res.status(200).send("User updated successfully.");
  } catch (error) {
    // Vid problem med kommunikationen med databasen, returnera 500 Internal Server Error
    console.error("Database error:", error);
    return res.status(500).send("Internal Server Error");
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
