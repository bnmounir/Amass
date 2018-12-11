var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var NodeGeocoder = require("node-geocoder");
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

// campgrounds

router.get("/", (req, res) => {
    Campground.find({}, (err, allcamps) => {
        if(err) {
            console.log(err);
        }else {
            res.render("campgrounds/index", {camps: allcamps, currentUser: req.user, page: 'campgrounds'});
        }
    });    
});

//create route
router.post("/", middleware.isLogged, (req, res) => {
    var name = req.body.name;
    var price = req.body.price;
    var image = req.body.image;
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    };
    geocoder.geocode(req.body.location, (err, data)=>{
        if(err || !data.length){
            req.flash("error", "Invalid address");
            return res.redirect("back");
        }
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        var location = data[0].formattedAddress;
        var newCamp = {name: name, price: price, image: image, description: desc, author: author, location: location, lat: lat, lng: lng};
        //create and asve to db
        Campground.create(newCamp, (err, newlyCreated) => {
            if(err){console.log(err)}
            else{
                res.redirect("/campgrounds");
            }
        });
    });    
});

//new route
router.get("/new", middleware.isLogged, (req, res) => {
    res.render("campgrounds/new");
});

//show route
router.get("/:id", (req, res) => {
    Campground.findById(req.params.id).populate("comments").exec((err, foundCamp) => {
        if(err || !foundCamp){
            req.flash("error","Campground not found!");
            res.redirect("back");
        } else {
            res.render("campgrounds/show", {camps: foundCamp});
        }
    });
});

//Edit
router.get("/:id/edit", middleware.isCampOwner, (req, res) => {
    Campground.findById(req.params.id, (err, foundCamp)=>{
        if(err || !foundCamp){
            req.flash("error", "camp not found");
        }
        res.render("campgrounds/edit", {camp: foundCamp});
    });
});

//Update
router.put("/:id", middleware.isCampOwner, function(req, res){
    geocoder.geocode(req.body.location, (err, data)=>{
        if(err || !data.length){
            req.flash("error", "Invalid address");
            return res.redirect("back");
        }  
        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;
        
        Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
  });
});

//Destroy Route
router.delete("/:id", middleware.isCampOwner, (req, res)=>{
    Campground.findByIdAndRemove(req.params.id, (err)=>{
        if(err){
            res.redirect("/campgrounds");
        }else{
            req.flash("success", "campground deleted!");
            res.redirect("/campgrounds");
        }
    });
});

module.exports = router;