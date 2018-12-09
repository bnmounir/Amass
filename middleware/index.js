var Campground = require("../models/campground");
var Comment    = require("../models/comment");

var middlewareObj = {};

middlewareObj.isCampOwner = function (req, res, next){
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, (err, foundCamp)=>{
            if(err || !foundCamp){
                req.flash("error","Campground not found!");
                res.redirect("back");
            }else{
                if(foundCamp.author.id.equals(req.user._id)) {
                    next();
                }else{
                    req.flash("error", "not permitted!");
                    res.redirect("back");    
                }
            } 
        });
    } else {
        res.redirect("back");    
    }
};

middlewareObj.isCommentOwner = function (req, res, next){
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, (err, foundComment)=>{
            if(err || !foundComment){
                req.flash("error", "comment not found");
                res.redirect("back");
            }else{
                if(foundComment.author.id.equals(req.user._id)) {
                    next();
                }else{
                    req.flash("error", "not permitted!");
                    res.redirect("back");    
                }
            } 
        });
    } else {
        req.flash("error", "please log-in first!");
        res.redirect("/login");    
    }
};

middlewareObj.isLogged = function (req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "Please login first!");
    res.redirect('/login');
};

module.exports = middlewareObj;