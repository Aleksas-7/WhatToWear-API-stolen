app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        await registerUser(username, email, password);
        res.json({ message: "User registered successfully" });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(400).json({ message: "User already exists" });
        }

        console.error("Error during registration:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
