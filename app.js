var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var methodOverride = require("method-override");
var User = require("./models/user");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var expressSession = require("express-session");

app.use(expressSession({
    secret: "Manish became one of the best developer",
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());
app.set("view engine", "ejs");
// mongoose.connect("mongodb://localhost/Blog_cat_app",  { useNewUrlParser: true });
mongoose.connect("mongodb://manish:manish1@ds213705.mlab.com:13705/yelpcamp",  { useNewUrlParser: true });
app.use(bodyParser.urlencoded({extended : true}));
app.use(methodOverride("_method"));

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    next();
})

passport.use(new LocalStrategy (User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//Post Schema

var postSchema = new mongoose.Schema({
    content: String,
    author: String,
    date: {type: Date, default:Date.now},
});

var Post = mongoose.model("Post", postSchema);

//SCHEMA
var catSchema =  new mongoose.Schema({
    name: String,
    image: String,
    date: {type: Date, default:Date.now},
    body: String,
    posts: [postSchema],
});

//MODEL
var Cat = mongoose.model("Cat", catSchema);

//ADDING A NEW CAT TO THE DB

// Cat.create({
//     name: "Silver Tabby Cat",
//     image: "https://images.unsplash.com/photo-1516978101789-720eacb59e79?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
//     body: "blah blah blah blah",
// });



//ROUTES

app.get("/", isLoggedIn,function(req, res){
    res.redirect("/cats");
})

app.get("/cats", isLoggedIn,function(req, res){
    // console.log(req.user);
    Cat.find({}, function(err, cat){
        if(err){
            console.log(err);
        }
        else {
            res.render("home", {cat : cat})
        }
    })
})

app.get("/cats/new",isLoggedIn,function(req, res){
    res.render("new");
})

app.post("/cats", isLoggedIn,function(req, res){
    // console.log(req.body.cat);
    // res.send("Post Route is hit!!!")
    Cat.create(req.body.cat, function(err, cat){
        if(err){
            console.log(err);
        }else{
            console.log("Added to Db Successfully");
            // console.log(cat);
            res.redirect("/cats")
        }
    })
})

app.get("/cats/:id", isLoggedIn,function(req, res){
    Cat.findById(req.params.id, function(err, foundCat){
        if(err){
            console.log(err);
            res.redirect("/cats");
        }else {
            res.render("show", {foundCat : foundCat});
        }
    })
})

app.get("/cats/:id/edit", isLoggedIn,function(req, res){
    Cat.findById(req.params.id, function(err, foundCat){
        if(err){
            console.log(err);
            res.redirect("/cats");
        } else{
            res.render("edit", {foundCat : foundCat})
        }
    })
})

app.put("/cats/:id", isLoggedIn,function(req, res){
    Cat.findOneAndUpdate({_id: req.params.id}, req.body.cat,function(err, updateCat){
        if(err){
            console.log(err);
            res.redirect("/cats")
        }else {
            res.redirect("/cats/" + req.params.id);
        }
    })
})

app.delete("/cats/:id", isLoggedIn,function(req, res){
    Cat.findByIdAndRemove(req.params.id, function(err){
        if(err){
            console.log(err);
            res.redirect("/cats");
        }else {
            res.redirect("/cats");
        }
    })
})


//COMMENT ROUTE

app.get("/cats/:id/comments/new", isLoggedIn,function(req, res){
    Cat.findById(req.params.id, function(err, cat){
        if(err){
            console.log(err);
        }else {
            res.render("commentform", {cat : cat})
        }
    })
})

app.post("/cats/:id/comments", isLoggedIn,function(req, res){
    // console.log(req.body);
    Cat.findById(req.params.id, function(err, cat){
        if(err){
            console.log(err);
            res.redirect("/cats");
        }else {
            cat.posts.push({
                content: req.body.comment,
                author: req.body.author,
            })
            cat.save(function(err, cat){
                if(err){
                    console.log(err);
                }else {
                    // console.log(cat);
                }
            })
        }
    })

    res.redirect("/cats/" + req.params.id);
})

//  ==================
//      AUTH ROUTE
//  ==================

//SINE IN ROUTE

app.get("/register", function(req, res){
    res.render("register");
})

app.post("/register", function(req, res){
    User.register(new User({username : req.body.username}), req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.redirect("/register");
        } 
        passport.authenticate("local")(req, res, function(){
            res.redirect("/cats");
        })
    })
});


//Login Route

app.get("/login", function(req, res){
    res.render("login");
})

app.post("/login", passport.authenticate("local", {
    successRedirect: "/cats",
    failureRedirect: "/login",
}), function(req, res){

});



///LOGOUT

app.get("/logout", function(req, res){
    req.logOut();
    res.redirect("/");
})


//Midware

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

var PORT = process.env.PORT || 8080;

app.listen(PORT, process.env.IP, function(){
    console.log("Server has Started!!!");
})
