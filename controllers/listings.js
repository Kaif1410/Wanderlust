const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });


module.exports.index = async (req, res) => {
    const allListing = await Listing.find();
    res.render("listings/index.ejs", { allListing });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate({path: "reviews", populate: {path: "author"}}).populate("owner");
    if(!listing){
        req.flash("error", "This item does not exist!");
        return res.redirect(`/listings`);
    }

    res.render("listings/show.ejs", { listing });
}

module.exports.createListing = async (req, res, next) => {
    // let {title, description, image, price, location, country} = req.body;
    // let listing = req.body.listing;

    let response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
    })
    .send();


    let url = req.file.path;
    let filename = req.file.filename;

    if (!req.body.listing) {
        throw new ExpressError(400, "Sned valid data for listing");
    }

    const newListing = Listing(req.body.listing);
    // if(!newListing.title){
    //     throw new ExpressError(400, "title is missing");
    // }
    // if(!newListing.description){
    //     throw new ExpressError(400, "Description is missing");
    // }
    // if(!newListing.location){
    //     throw new ExpressError(400, "Location is missing");
    // }
    // newListing.image = {
    //     filename: "listingimage",
    //     url: req.body.listing.image
    // }
    newListing.owner = req.user._id;
    newListing.image = {url, filename};

    newListing.geometry = response.body.features[0].geometry;

    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect(`/listings`);
}

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error", "This item does not exist!");
        return res.redirect(`/listings`);
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
}

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listingData = req.body.listing;

    // listingData.image = {
    //     filename: "listingimage",
    //     url: listingData.image
    // }

    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    if(typeof req.file !== "undefined"){
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
}

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedList = await Listing.findByIdAndDelete(id);
    // console.log(deletedList);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
}