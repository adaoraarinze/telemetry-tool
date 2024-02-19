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

mongoose.connect(process.env.MONGODB_URI);

app.get('/', (req, res) => { 
    res.sendFile(__dirname + "/index.html");
});

const dataSchema = new mongoose.Schema({
    fileName: String,
    linesAdded: Number,
    linesDeleted: Number,
    charactersAdded: Number,
    charactersDeleted: Number,
    charactersModified: Number,
    fileLines: String,
    position: Number,
    type: String,
    time: String,
    thinkingTime: String,
    userID: String
});

// eslint-disable-next-line @typescript-eslint/naming-convention
const Data = mongoose.model('Data', dataSchema);

app.post('/api', async (req, res) => {
  try {
    const newData = new Data({
        fileName: req.body.fileName,
        linesAdded: req.body.linesAdded,
        linesDeleted: req.body.linesDeleted,
        charactersAdded: req.body.charactersAdded,
        charactersDeleted: req.body.charactersDeleted,
        charactersModified: req.body.charactersModified,
        fileLines: req.body.fileLines,
        position: req.body.position,
        type: req.body.type,
        time: req.body.time,
        thinkingTime: req.body.thinkingTime,
        userID: req.body.userID
    });
    await newData.save();
    res.json({ message: 'Data saved successfully' });
  } 
  catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error saving data' });
  }
});

module.exports = app;