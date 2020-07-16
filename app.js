const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const passport = require('passport');
const mongoose = require('mongoose');
const config = require('./config/database');

// Connect To Database
mongoose.connect(config.database);
const app = express();

const users = require('./routes/users');



// CORS Middleware
app.use(cors());

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

//making uploads file publically available
app.use('/uploads',express.static('uploads'));

// Body Parser Middleware
app.use(bodyParser.json());

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

require('./config/passport')(passport);

app.use('/users', users);


const port = 3000;
// Index Route
app.get('/', (req, res) => {
  res.send('Invalid Endpoint');
});

app.listen(process.env.PORT || port, () => {
    console.log('Server started on port '+port);
});