var express    = require("express");
var router     = express.Router({mergeParams: true});
var Campground = require("../models/campground");
var Comment    = require("../models/comment");
var middleware = require("../middleware");

//comments new
router.get("/new", middleware.isLogged, function(req, res){
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
        } else {
            res.render("comments/new", {campground: campground});
        }
    });
});

router.post("/", (req, res)=>{
    Campground.findById(req.params.id, (err, campground)=>{
        if(err){
            console.log(err);
            res.redirect("/campgrounds");
        } else{
            Comment.create(req.body.comment, function(err, comment){
                if(err){
                    req.flash("error", "something went wrong!");
                    console.log(err);
                }
                else{
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();
                    campground.comments.push(comment);
                    campground.save();
                    req.flash("success", "comment successfully added!");
                    res.redirect("/campgrounds/"+ campground._id);
                }
            });
        }
    });
});

//edit
router.get("/:comment_id/edit", middleware.isCommentOwner, (req, res)=>{
    Campground.findById(req.params.id, (err, foundcamp)=>{
        if(err || !foundcamp){
            res.flash("error", "not valid");
            return res.redirect("back");
        }
        Comment.findById(req.params.comment_id, (err, commentFound)=>{
            if(err || !commentFound){
                res.redirect("back");
            }else{
                res.render("comments/edit", {camp_id: req.params.id, comment: commentFound});
            }
        }); 
    });
});

//update
router.put("/:comment_id", middleware.isCommentOwner, (req, res)=>{
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, (err, updatedComment)=>{
        if(err){
            res.redirect("back");
        }else{
            res.redirect("/campgrounds/" + req.params.id );
        }
    });
});

//Destroy
router.delete("/:comment_id", middleware.isCommentOwner, (req, res)=>{
   Comment.findByIdAndRemove(req.params.comment_id, (err)=>{
       if(err){
           res.redirect("back");
       } else {
           req.flash("success", "Comment deleted!");
           res.redirect("/campgrounds/"+ req.params.id);
       }
   });
});

module.exports = router;