require('dotenv').config();
const express = require('express')
const cors = require('cors')
const dbConfig = require('./config')
const auth = require('./services/authentication')
const axios = require('axios')
const utility = require('./utility')
const app = express()
app.use(cors())
// const jwt = require('jsonwebtoken') 


app.use(express.json())


// User Sign-Up
app.post('/updateUser', async (req, res) => {
    try {

        const { name, email, password, phoneNumber, role, uid } = req.body.body;

        // // Create the user in Firebase Authentication
        // const userRecord = await dbConfig.admin.auth().createUser({
        //     displayName: name,
        //     email,
        //     password,
        //     phoneNumber,
        //     emailVerified: false, // Set to true if you want to auto-verify user emails
        // });
        
        //updating user name and phone number
        const userRecord = await dbConfig.admin.auth().updateUser(uid, {
            displayName: name,
            phoneNumber: phoneNumber
        });

        // await dbConfig.admin.auth().sendEmailVerification(userRecord.email).then((res)=>{
        //     console.log(res);
        // });

        // Store the user role and UUID in the Firestore collection "UserRole"
        const userRoleData = {
            role: role,
            uid: userRecord.uid,
        };

        await dbConfig.admin.firestore().collection('UserRole').add(userRoleData);

        return res.status(200).send({
            status: "Success",
            errorCode: 200,
            message: "User sign-up successful.",
            data: userRecord
        });
    } catch (error) {
        // console.error('Error during sign-up:', error);
        if (error.message.includes("phone number")) {
            res.status(200).json({
                message: 'Please enter your phone number with the country code (eg +353).',
                errorCode: 500
            });
        } else {
            res.status(200).json({
                message: error.message,
                errorCode: 500
            });
        }
    }
});

// getting air quality data from openweathermap
app.get("/airqualitydata", auth.checkIfAuthenticated, async (req, res) => {
    const reqData = req.headers;
    const { lat, long } = reqData;
    // Make request
    axios.get(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${long}&appid=${process.env.OPEN_WEATHER_APP_ID || 'bdb34a14b4eb963b612d01b5949374cd'}`)
        .then(airRes => {
            // console.log(airRes.data);
            res.send(airRes.data)
        })
        .catch (error =>{
            //    console.error('Error in saving the data', error);
               res.status(200).json({ errorCode: 500, message: error.message });
            });
});

// saving air quality data into firestore auth.checkIfAuthenticated, 
app.post("/saveAirQualityData", auth.checkIfAuthenticated, async (req, res) => {
    try {
        data = req.body.body;
        await dbConfig.AirQualityData.doc(`/${Date.now()}/`).set({
            id: Date.now(),
            lat: data.lat,
            lon: data.lon,
            aqi: data.aqi,
            co: data.co,
            no: data.no,
            no2: data.no2,
            o3: data.o3,
            so2: data.so2,
            pm2_5: data.pm2_5,
            pm10: data.pm10,
            nh3: data.nh3,
            date: data.date,
            time: data.time
        });

        if (data.aqi > 6 && data.aqi < 11) {
            // Fetch user emails from Firebase Authentication and send email notifications
            const usersSnapshot = await dbConfig.admin.auth().listUsers();
            const emails = [];
            usersSnapshot.users.forEach(user => {
                emails.push(user.email);
            });
            const emailBody = `
            Hello User,
            
            The recent air quality index recorded at ${data.time} on ${data.date} is ${data.aqi} at lat: ${data.lat}, lon: ${data.lon}. Readings for the air pollutants are given below.
            co: ${data.co},
            no: ${data.no},
            no2: ${data.no2},
            o3: ${data.o3},
            so2: ${data.so2},
            pm2_5: ${data.pm2_5},
            pm10: ${data.pm10},
            nh3: ${data.nh3}
            Please take necessary precautions.
            
            Thanks & regards,
            Team IEM.`
            utility.sendEmailNotification(emails, emailBody);
        }

        return res.status(200).send({
            status: "Success",
            errorCode: 200,
            message: "Data saved successfully."
        });
    } catch (error) {
        // console.error('Error in saving the data', error);
        res.status(200).json({ errorCode: 500, message: error.message });
    }
});

// get all air quality data auth.checkIfAuthenticated,
app.get("/getAllAirQualityData", auth.checkIfAuthenticated, async (req, res) => {
    try {
        // Get the readingStatus from the request header
        const readingStatus = req.header("readingStatus");
        let query = dbConfig.AirQualityData;

        // Conditional filtering based on readingStatus
        if (readingStatus === "good") {
            query = query.where("aqi", ">=", 1).where("aqi", "<=", 3);
        } else if (readingStatus === "fair") {
            query = query.where("aqi", ">=", 4).where("aqi", "<=", 6);
        } else if (readingStatus === "poor") {
            query = query.where("aqi", ">=", 7).where("aqi", "<=", 9);
        } else if (readingStatus === "veryPoor") {
            query = query.where("aqi", "==", 10);
        }

        // Execute the query
        const querySnapshot = await query.get();

        // let response = [];

        // await query.get().then((data) => {
        //     let docs = data.docs;

        //     docs.map((doc) => {
        //         const selectedItem = {
        //             id: doc.data().id,
        //             lat: doc.data().lat,
        //             lon: doc.data().lon,
        //             aqi: doc.data().aqi,
        //             co: doc.data().co,
        //             no: doc.data().no,
        //             no2: doc.data().no2,
        //             o3: doc.data().o3,
        //             so2: doc.data().so2,
        //             pm2_5: doc.data().pm2_5,
        //             pm10: doc.data().pm10,
        //             nh3: doc.data().nh3,
        //             date: doc.data().date,
        //             time: doc.data().time
        //         };

        //         response.push(selectedItem);
        //         response.reverse();
        //     });
        //     return response;
        // });

        const airQualityData = [];
        querySnapshot.forEach((doc) => {
            airQualityData.push(doc.data());
        });
        return res.status(200).send({
            status: "Success",
            errorCode: "200",
            data: airQualityData.reverse()
        });

    } catch (error) {
        // console.log(error);
        return res.status(200).send({ status: "Failed", errorCode: "500", message: error.message });
    }
});

// get the latest reading for each unique set of coordinates auth.checkIfAuthenticated,
app.get('/getLatestAirQualityReadings', auth.checkIfAuthenticated, async (req, res) => {
    try {

        // Step 1: Retrieve all readings
        const querySnapshot = await dbConfig.AirQualityData.get();
        const readings = [];

        // Convert querySnapshot to an array of readings
        querySnapshot.forEach((doc) => {
            readings.push({
                id: doc.id,
                ...doc.data(),
            });
        });

        // Step 2: Group readings by coordinates
        const groupedReadings = readings.reduce((groups, reading) => {
            const key = `${reading.lat}_${reading.lon}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(reading);
            return groups;
        }, {});

        // Step 3: Find latest reading for each group
        const latestReadings = Object.values(groupedReadings).map((group) => {
            const latestReading = group.reduce((latest, current) => {
                const latestDateTime = new Date(`${latest.date} ${latest.time}`);
                const currentDateTime = new Date(`${current.date} ${current.time}`);
                return currentDateTime > latestDateTime ? current : latest;
            });
            return latestReading;
        });

        // Respond with the latest readings for each unique set of coordinates
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).send({errorCode: "200", data: latestReadings });
    } catch (error) {
        // console.error('Error retrieving readings: ', error);
        res.status(200).json({
            errorCode: 500,
            error: error.message
        });
    }
});

// api to get user role auth.checkIfAuthenticated,
app.get('/getUserRole', auth.checkIfAuthenticated, async (req, res) => {
    try {
        const uid = req.headers.uid; // taking the UID in the "uid" header

        // Retrieve the role from the Firestore collection "UserRole" based on the UID
        const querySnapshot = await dbConfig.admin.firestore()
            .collection('UserRole')
            .where('uid', '==', uid)
            .get();

        if (querySnapshot.empty) {
            return res.status(200).json({
                errorCode: 404,
                message: 'User role not found'
            });
        }

        const userRoleData = querySnapshot.docs[0].data();
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json({ role: userRoleData.role });
    } catch (error) {
        // console.error('Error getting user role:', error);
        res.status(200).json({ errorCode: 500, message: error.message });
    }
});

// getting data of specific lat and lon auth.checkIfAuthenticated,
app.get('/searchAQIdata', auth.checkIfAuthenticated, async (req, res) => {
    try {
        const lat = parseFloat(req.headers.lat);
        const lon = parseFloat(req.headers.lon);

        // Retrieve air quality data from the Firestore collection "AirQualityData" based on latitude and longitude
        const querySnapshot = await dbConfig.admin.firestore()
            .collection('AirQualityData')
            .where('lat', '==', lat)
            .where('lon', '==', lon)
            .get();

        if (querySnapshot.empty) {
            return res.status(200).json({
                message: 'Air quality data not found.',
                errorCode: 404
            });
        }

        // const airQualityData = querySnapshot.docs[0].data();
        const airQualityData = querySnapshot.docs
            .map(doc => doc.data())
            .sort((a, b) => {
                const dateTimeA = new Date(`${a.date} ${a.time}`);
                const dateTimeB = new Date(`${b.date} ${b.time}`);
                return dateTimeB - dateTimeA; // Sort in descending order (latest first)
            })[0];


        return res.status(200).json({ data: airQualityData });
    } catch (error) {
        // console.error('Error getting air quality data:', error);
        res.status(200).json({
            errroCode: 500,
            message: error.message
        });
    }
});

// get the list of objects of coordinates
app.get('/getUniqueCoordinates', async (req, res) => {
    try {
        // Query Firestore collection to retrieve all documents
        const querySnapshot = await dbConfig.admin.firestore()
            .collection('AirQualityData') // Replace with your actual collection name
            .get();

        if (querySnapshot.empty) {
            return res.status(200).json({ errorCode: 404, message: 'No data found' });
        }

        const uniqueCoordinatesMap = new Map();
        querySnapshot.forEach(doc => {
            const data = doc.data();
            const coordinate = `${data.lat},${data.lon}`;
            if (!uniqueCoordinatesMap.has(coordinate)) {
                uniqueCoordinatesMap.set(coordinate, { lat: data.lat, lon: data.lon });
            }
        });

        const uniqueCoordinatesList = Array.from(uniqueCoordinatesMap.values());

        return res.status(200).json({dataList: uniqueCoordinatesList});
    } catch (error) {
        // console.error('Error getting unique coordinates:', error);
        res.status(200).json({ errorCode: 500, message: error.message });
    }
});

// it get the data b/w a range of dates for specific coordinates
app.get('/getChartValues', async (req, res) => {
    try {
        const fromDate = req.header('fromDate');
        const toDate = req.header('toDate');
        const lat = parseFloat(req.header('lat'));
        const lon = parseFloat(req.header('lon'));

        // Query Firestore collection to retrieve data within the specified date range and coordinates
        const querySnapshot = await dbConfig.admin.firestore()
            .collection('AirQualityData') // Replace with your actual collection name
            .where('lat', '==', lat)
            .where('lon', '==', lon)
            .where('date', '>=', fromDate)
            .where('date', '<=', toDate)
            .get();

        // console.log(querySnapshot);

        const dataInRange = querySnapshot.docs.map(doc => doc.data());

        return res.status(200).json(dataInRange);
    } catch (error) {
        // console.error('Error getting data between dates and coordinates:', error);
        res.status(200).json({ errorCode: 500, message: error.message });
    }
});


const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Up and running ${PORT}`))
