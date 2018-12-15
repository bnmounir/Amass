var express    = require("express");
var router     = express.Router();
var passport   = require("passport");
var User       = require("../models/user");
var Campground = require("../models/campground");
var middleware = require("../middleware");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");

require("dotenv").config();    
//index route
router.get("/", (req, res) => {
  res.render("landing");  
});



//Auth
// show register form
router.get("/register", function(req, res){
   res.render("register", {page: 'register'}); 
});

//sign up logic
router.post("/register", (req, res)=>{
    let newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        avatar: req.body.avatar,
    });
    // eval(require("locus")); <==== is a testing tool to see the output of variables from
    User.register(newUser, req.body.password, (err, user)=>{
        if(err){
            req.flash("error", err.message);
            return res.redirect('/register');
        }
        passport.authenticate('local')(req, res, ()=>{
            req.flash("success", `Welcome to Campgrounds ${user.username}!`);
            res.redirect('/campgrounds');
        });
    });
});

//admin logic auth
router.get("/admin", middleware.isLogged, function(req, res){
    if(req.user.isAdmin !== true){
        res.render("admin", {page: 'admin'});      
    } else {
        req.flash("success",`${req.user.username}, you are already an admin, no need to go there!`);
        res.redirect('/campgrounds');
    }
});

router.post("/admin", middleware.isLogged, (req, res) => {
    if(req.body.adminCode === process.env.ADMIN_SECRET){
        req.user.isAdmin = true;
 
        User.findByIdAndUpdate(req.user._id, {$set: req.user}, function(err, user) {
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        }    
        else {
            req.flash("success",`Welcome to Administrator Authority Campgrounds, ${req.user.username}!`);
            res.redirect("/campgrounds/");
        }
        });    
    }else {
        res.flash("success","permission denied!");
        res.redirect("/campgrounds/");    
    }
});


//show login form
router.get("/login", function(req, res){
   res.render("login", {page: 'login'}); 
});

router.post('/login', (req, res, next)=>{
    passport.authenticate('local',{
    successRedirect: "/campgrounds",
    successFlash: `Welcome Back, ${req.body.username}!`,
    failureRedirect: "/login",
    failureFlash: true
    })(req, res); 
});

//logout
router.get('/logout', (req,res)=>{
    req.logout();
    req.flash("success", "Logged out successfully!");
    res.redirect('/campgrounds');
});

//user profile
router.get("/users/:id", middleware.isLogged, (req, res)=> {
    User.findById(req.params.id, (err, foundUser)=>{
        if(err){
            req.flash("error", "couldn't find user!");
            return res.redirect("/campgrounds");
        }
        Campground.find().where("author.id").equals(foundUser._id).exec(function(err, campgrounds) {
            if(err){
                req.flash("error", "couldn't find data!");
                return res.redirect("/campgrounds");    
            }           
            res.render("users/show", {user: foundUser, campgrounds: campgrounds});    
        });
    });
});

// forgot route
router.get("/forgot", (req, res)=>{
    res.render("forgot", {page: "register"});
});

router.post("/forgot", (req, res, next)=>{
    async.waterfall([
        function(done){
            crypto.randomBytes(20, (err, buf)=>{
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done){
            User.findOne({ email: req.body.email }, (err, user)=>{
                if(err || !user){
                    req.flash("error", "No account with that email address exists!");
                    return res.redirect("/forgot");
                }
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000;
                user.save((err)=>{
                    done(err, token, user);
                });
            });
        },
        function(token, user, done){
            var smtpTransport = nodemailer.createTransport({
                service:"Gmail",
                auth: {
                    user: 'mail12asswor13eset2018@gmail.com',
                    pass: process.env.GMAILPWD
                }
            });
            var mailOptions = {
                to: user.email,
                from: '"Campground Yelpper" <mail12asswor13eset2018@gmail.com>',
                subject: 'Do-Not-Reply Password Reset',
                text:   'Reset Password \n'+
                        'A password reset event has been triggered. The password reset window is limited to one hour.\n'+
                        'If you do not reset your password within one hour, you will need to submit a new request.\n'+
                        'To complete the password reset process, visit the following link:\n'+
                        'https://'+ req.headers.host +'/reset/'+ token +'\n\n'+
                        'if you didn\'t request a reset please contact us from our website!' 
            };
            smtpTransport.sendMail(mailOptions, (err)=>{
                if(err) {
                    return req.redirect('/forgot');
                }
                req.flash('success', `An e-mail has been sent to ${user.email} with further instructions.`);
                done(err, 'done');
            });
          }
        ], function(err) {
            if(err) return next(err);
            res.redirect('/forgot');
    });
});

//the reset token
router.get("/reset/:token", (req, res)=>{
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now() } }, (err, user)=>{
        if(err || !user){
            req.flash('error', 'Password reset token is invalid or has expired.');
            return req.redirect('/forgot');
        }
        res.render('reset', {token: req.params.token});
    });
});

router.post('/reset/:token', (req, res)=>{
    async.waterfall([
        function(done){
          User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now() } }, (err, user)=>{
            if(err || !user){
                req.flash('error', 'Password reset token is invalid or has expired.');
                return req.redirect('/forgot');
            }
            if(req.body.password === req.body.confirm){
                user.setPassword(req.body.password, (err)=>{
                    if(err){return req.redirect('/forgot');};
                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpires = undefined;
                    
                    user.save((err)=>{
                        if(err){return req.redirect('/forgot');};
                        req.logIn(user, (err)=>{
                            done(err, user);
                        });
                    });
                });
            }else{
                req.flash('error', 'Passwords Don\'t Match.');
                return res.redirect('back');
            }
        });
      },
      function(user, done){
          var smtpTransport = nodemailer.createTransport({
              service: 'Gmail',
              auth: {
                  user: 'mail12asswor13eset2018@gmail.com',
                  pass: process.env.GMAILPWD
              }
          });
          var  mailOptions = {
              to: user.email,
              from: '"Campground Yelpper" <mail12asswor13eset2018@gmail.com>',
              subject: 'Password Reset Confirmation',
              text: 'Password Change Confirmation\n'+
                    'Your password was successfully changed.\n'
          };
          smtpTransport.sendMail(mailOptions, (err)=>{
              req.flash('success', 'Success! Your Password has been changed.');
              done(err);
          });
        }
    ], function(err) {
        if(err){
            req.flash("error", 's0m3th1n9 w3nt wr0ng')
            return res.redirect('/campgrounds');
        }
        req.flash('success', 'Password successfully changed!');
        res.redirect('/campgrounds');
    });
});

module.exports = router;