const express = require('express');
const morgan = require('morgan') // logging
const path = require('path');
const _colors = require('colors');
require('dotenv').config("../.env");
const PORT = process.env.PORT || 5000;
const bodyParser = require('body-parser') // middleware
const exphbs = require('express-handlebars'); // templating engine
const connectDB = require('./config/db.js');
const app = express();

const { ensureAuth } = require('./middleware/auth') // auth middleware to protect routes

//Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
  console.log('>>>>> Morgan enabled for logging in this development environment')
}
connectDB();

app.engine(
  '.hbs',
  exphbs.engine({
    defaultLayout: 'main',
    extname: '.hbs',
  })
);
app.set('view engine', '.hbs');

app.set('views', './views');

// Express Middleware
app.use(express.static(path.join(__dirname, 'public'))); //Serve Static Files
app.use(bodyParser.json()) // JSON Body Parser
app.use(bodyParser.urlencoded({ extended: true }))  // URL Encoded Body Parser
app.use(express.json())  // JSON support on Express
app.use(express.urlencoded({ extended: true }))


// PUBLIC SECURITY CONTEXT
app.use('/' , require('./routes/index.js'));
// Functions that touch the database route through the api
app.use('/api', require('./routes/api.js'));
// HTTP Page rendering Routes (User Context)




app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})