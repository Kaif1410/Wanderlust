const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js")
require("dotenv").config();

const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

const MongoUrl = "mongodb://127.0.0.1:27017/wanderlust";

main().then(()=>{
    console.log("connected to DB");
}).catch((err)=>{
    console.log(err);
})

async function main(){
    await mongoose.connect(MongoUrl);
}

const initDB = async () =>{
    await Listing.deleteMany({});
    // initData.data = initData.data.map((obj) => ({ ...obj, owner: "681e01447f41b0e5564dad42"}));

    // Add the map in existing listing
    for (let obj of initData.data) {
    try {
      const geoRes = await geocodingClient
        .forwardGeocode({
          query: obj.location,
          limit: 1,
        })
        .send();

      if (
        geoRes.body.features &&
        geoRes.body.features.length > 0
      ) {
        obj.geometry = geoRes.body.features[0].geometry;
        obj.owner = "681e01447f41b0e5564dad42";
        await Listing.create(obj);
        console.log(`Inserted: ${obj.title}`);
      } else {
        console.log(`No location found for: ${obj.title}`);
      }
    } catch (err) {
      console.log(`Error inserting ${obj.title}: ${err.message}`);
    }
  }

    await Listing.insertMany(initData.data);
    console.log("data was initialized");
};

initDB();
main();