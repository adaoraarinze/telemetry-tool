const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

const port = 3000;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));

mongoose.connect(process.env.MONGO_KEY);

app.get('/', (req, res) => { 
    console.log(req.body);
    res.sendFile(__dirname + "/index.html");
});

// Create a Mongoose Schema for your data
const dataSchema = new mongoose.Schema({
    currentLine: String,
    position: Number,
});
  
// Create a Mongoose Model based on the Schema
const Data = mongoose.model('Data', dataSchema);
  
// API endpoint to receive and store data
app.post('/', async (req, res) => {
  try {
    const newData = new Data({
        currentLine: req.body.currentLine,
        position: req.body.position,
    });
      await newData.save(); // Save the data to the database
      res.json({ message: 'Data saved successfully' });
    } 
  catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error saving data' });
  }
});

app.get('/data', (req, res) => {
    console.log(req.body);
    res.send('data received');
});