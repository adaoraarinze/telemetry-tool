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
    res.sendFile(__dirname + "/index.html");
});

// Create a Mongoose Schema for your data
const dataSchema = new mongoose.Schema({
    fileName: String,
    linesAdded: Number,
    linesDeleted: Number,
    charactersAdded: Number,
    charactersDeleted: Number,
    charactersModified: Number,
    position: Number,
    type: String,
    userID: String
});
  
// Create a Mongoose Model based on the Schema
// eslint-disable-next-line @typescript-eslint/naming-convention
const Data = mongoose.model('Data', dataSchema);
  
// API endpoint to receive and store data
app.post('/', async (req, res) => {
  try {
    const newData = new Data({
        fileName: req.body.fileName,
        linesAdded: req.body.linesAdded,
        linesDeleted: req.body.linesDeleted,
        charactersAdded: req.body.charactersAdded,
        charactersDeleted: req.body.charactersDeleted,
        charactersModified: req.body.charactersModified,
        position: req.body.position,
        type: req.body.type,
        userID: req.body.userID
    });
      await newData.save(); // Save the data to the database
      res.json({ message: 'Data saved successfully' });
    } 
  catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error saving data' });
  }
});