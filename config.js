const firebase = require('firebase')
// const firebaseConfig = {
//     apiKey: "AIzaSyBrkT6Gqs8kqnqT9nBahOMaNd_cXf9YsAQ",
//     authDomain: "interactive-map-d361d.firebaseapp.com",
//     projectId: "interactive-map-d361d",
//     storageBucket: "interactive-map-d361d.appspot.com",
//     messagingSenderId: "770149799781",
//     appId: "1:770149799781:web:308b82ef6eb07edb16738c",
//     measurementId: "G-Z2D92SZFGR"
// };
const firebaseConfig = {
    apiKey: "AIzaSyBDFDlfZkXhFhTK-9-dgCuEb0zEuPbTXdM",
    authDomain: "interactive-map-e7908.firebaseapp.com",
    projectId: "interactive-map-e7908",
    storageBucket: "interactive-map-e7908.appspot.com",
    messagingSenderId: "185676807819",
    appId: "1:185676807819:web:da8cc5631a1437f7cb9e8e",
    measurementId: "G-T6EYVDGC0H"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const User = db.collection("Users");
const AirQualityData = db.collection("AirQualityData");
// module.exports = AirQualityData;
// exports.AirQualityData = AirQualityData;

const admin = require("firebase-admin")

const credentials = require("./serviceAccountKey.json")
admin.initializeApp({
    credential: admin.credential.cert(credentials),
});

module.exports = { User: User, AirQualityData: AirQualityData, admin: admin }
