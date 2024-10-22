import express from "express";

const app = express();

app.use(express.json());
app.listen(3000, () => {
    console.log("API veikia");
});

app.get("/", (req, res) => {
    res.status(200).send({
        message: "akdasndjandk",
    });
});
