import _colors from 'colors';
import 'body-parser';
import { default as connectMongoDBSession } from 'connect-mongodb-session';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import express from 'express';
import fileUpload from 'express-fileupload';
import flash from 'express-flash';
import { create } from 'express-handlebars'; // templating engine
import session from 'express-session';
import handlebarsHelpers from 'handlebars-helpers';
import paginate from 'handlebars-paginate';
import morgan from 'morgan'; // logging
import passport from 'passport';
import connectDB from './config/db.js';
import passportConfig from './config/passport.js';
import { checkAuth, isManager } from './middleware/auth.js';
import { default as dashboardRouter } from './routes/dashboard.js';
import { default as toolRouter } from './routes/tool.js';
import { default as userRouter } from './routes/user.js';
import { default as indexRoutes } from './routes/index.js';
import { default as managerRouter } from './routes/manager.js';
import { rateLimiter, createAccountLimiter } from './config/rateLimiter.js';
dotenv.config()
const MongoDBStore = connectMongoDBSession(session);
const PORT = process.env.PORT || 5000;

const app = express();

//Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
  console.info('[INIT]>>>>> Morgan enabled for logging in this development environment')
}
//database stuff
connectDB();
let store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: 'sessions'
});
//handlebars config
// Handlebars

const hbs = create({
  helpers: {
    paginate: paginate,
    ...handlebarsHelpers(),
  },
  extname: '.hbs',
  defaultLayout: 'main',
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true,
  },
})

app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
app.set('views', './src/views');

// Express Middleware
app.use(express.static('./src/public')); //Serve Static Files
app.use(express.json()) // JSON Body Parser
app.use(fileUpload())
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded values
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 },
  store: store
}))
app.use(flash());
// Passport
passportConfig(app);
app.use(passport.initialize())
app.use(passport.session())

app.use(rateLimiter)

// Routes (No User Context)
app.use('/', indexRoutes);
// Routes (User Context)
app.use(checkAuth)
app.use('/user', userRouter);
app.use('/dashboard', dashboardRouter);
app.use('/tool', toolRouter);
app.use(isManager)
app.use('/manager', managerRouter);
// catch 404 and forward to error handler
app.use(function (_req, _res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.listen(PORT, () => {
  console.info(`[INIT] Server is running on port ${PORT}`);
})