const express = require("express");
const bcrypt = require("bcrypt");

const app = express();
const port = 3000;

// Middleware för att hantera JSON-data
app.use(express.json());

// POST-routen för att hasha lösenordet
app.post("/hash-password", async (req, res) => {
  const { password } = req.body;

  try {
    // Generera ett salt med en styrka på 10
    const salt = await bcrypt.genSalt(10);
    // Hasha lösenordet med saltet
    const hashedPassword = await bcrypt.hash(password, salt);

    // Skicka det hashade lösenordet tillbaka som svar
    res.status(200).json({ hashedPassword });
  } catch (error) {
    console.error("Error hashing password:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Starta servern
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
