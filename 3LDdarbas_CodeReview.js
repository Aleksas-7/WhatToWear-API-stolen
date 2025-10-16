app.post("/api/chatgpt/regenerate", async (req, res) => {
    const generation_id = req.body.id;
    try {
        const test = await pool.query(
            "SELECT * FROM generation_history WHERE id = ($1)",
            [generation_id]
        );

        let weatherData = JSON.parse(test.rows[0].prompt).weatherData;

        const userPreferences = JSON.parse(test.rows[0].prompt).userPreferences;

        const currentDate = new Date();
        const date = currentDate.toISOString().split("T")[0];

        const latitude = weatherData.latitude;
        const longitude = weatherData.longitude;

        const weatherResponse = await axios.get(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weather_code`
        );

        const chatResponse = await chatGPTPrompt(
            weatherResponse.data,
            userPreferences,
            date
        );

        const responseText = chatResponse.data.choices[0].message.content;

        const cleanedResponse = responseText
            .replace(/^```json\n/, "")
            .replace(/\n```$/, "");

        const jsonObject = JSON.parse(cleanedResponse);

        const clothingItems = jsonObject.clothes;
        weatherData = weatherResponse.data;
        const result = await pool.query(
            "UPDATE generation_history SET prompt = $1, response = $2 WHERE id = $3 RETURNING *",
            [
                JSON.stringify({
                    weatherData,
                    userPreferences,
                    date,
                }),
                cleanedResponse,
                generation_id,
            ]
        );
        if (result) res.status(200).send("regenerated succesfully");
        else res.status(400).send("error updating table");
    } catch (error) {
        console.error("Error regenerating history:", error);
    }
});



app.post(
    "/api/rate/:generationId/:rating",
    ensureAuthenticated,
    async (req, res) => {
        const { generationId, rating } = req.params;

        if (!rating || rating < 1 || rating > 5) {
            return res
                .status(400)
                .json({ message: "Rating must be between 1 and 5" });
        }

        try {
            const { rowCount } = await pool.query(
                "UPDATE generation_history SET rating = $1 WHERE id = $2 AND user_id = $3",
                [rating, generationId, req.user.id]
            );

            if (rowCount === 0) {
                return res.status(404).json({
                    message: "Generation not found or not authorized",
                });
            }

            res.json({ message: "Rating saved successfully" });
        } catch (error) {
            console.error("Error saving rating:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
);

