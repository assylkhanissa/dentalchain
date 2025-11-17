const express = require("express");
const router = express.Router();

// Маршруттар
router.get("/", (req, res) => {
  res.send("Барлық қолданушылар тізімі");
});

router.post("/", (req, res) => {
  res.send("Жаңа қолданушы қосылды");
});

module.exports = router;
