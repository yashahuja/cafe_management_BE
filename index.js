require('dotenv').config();
const express = require('express')
const cors = require('cors')
const app = express()
app.use(cors())
app.use(express.json())
const userRoute = require('./routes/user')
const aqiRoute = require('./routes/aqi')


app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use('/user', userRoute);
app.use('/aqi', aqiRoute);

module.exports = app;