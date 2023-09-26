const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = 3000;
app.get('/', (req, res) => res.send('waiting for data...'));
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
/*
app.post('/data', (req, res) => {
    console.log(req.body);
    res.send('data received');
});
*/