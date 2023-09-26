const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = 3000;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));

app.get('/', (req, res) => { 
    res.sendFile(__dirname + "/index.html");
});


app.post("/", (req, res) => {
    res.send("received data");
  });


/*
app.post('/data', (req, res) => {
    console.log(req.body);
    res.send('data received');
});
*/