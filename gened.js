app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  // Validate input fields
  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields (username, email, password) are required." });
  }

  try {
    // Insert new user into the database
    const query = `
      INSERT INTO users (username, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, username, email;
    `;
    const values = [username, email, password];

    const result = await pool.query(query, values);
    const newUser = result.rows[0];

    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    // Handle PostgreSQL duplicate key error (unique violation)
    if (error.code === "23505") {
      return res.status(400).json({ error: "User already exists." });
    }

    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});
