const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");
// const cookieParser = require("cookie-parser");
// const TestUser = require("./schema.js")

const app = express();
// app.use(cookieParser())
app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));


const testUserSchema = new mongoose.Schema({
    username:String,
    password:String
})

const TestUser = new mongoose.model("test",testUserSchema);

// module.exports.TestUser = TestUser;


mongoose.set('strictQuery', false);
mongoose.connect("mongodb://127.0.0.1:27017/testUserDB");
// TestUser.collection.insertOne({username:"test1",password:"1234"});


// session.store.all(function(err,sessions){
//     console.log(sessions);
// })
// sessionStore.all(function(err,sessions){
//     console.log(sessions);
// })

app.use(session({
    secret: 'andhisnameisjohncena.',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: 'mongodb://127.0.0.1:27017/testStore',
        touchAfter: 60 ,// time period in seconds
        // serialize:true
      })
    // cookie: { secure: true,
    //             maxAge:6000}
  }))

app.get("/",function(req,res){
    res.render("home");
    console.log(req.session);
    
})


const findTheUserByUserId =  function(req,res,next){
    
    TestUser.findOne({_id:req.session.userId},function(err,result){
       if(err){
           console.log(err);
           res.sendStatus(401);
       }else{
            if(result){
                console.log("result obtained");
                console.log(req.session);
                console.log(req.session.userId);
                return next();
            }else{
                console.log("no result");
                console.log(req.session);
                res.sendStatus(401);
            }
       }
   });
}

app.get("/secret",findTheUserByUserId, function(req,res){
    console.log("secret");
    console.log(req.session);
    res.render("secret");
})


app.get("/secret",function(req,res){
    console.log("secret");
    console.log(req.session);
    if(req.session.allow){
        res.render("secret");
    }else{
        res.redirect("/login");
    }
})

app.get("/login",function(req,res){
    console.log("login");
    console.log(req.session);
    // console.log(req.session.id);
    // console.log(req.sessionID);
    console.log(req.sessionStore);
    // req.sessionStore.clear();
    res.render("login");
});

app.post("/login",function(req,res){
    console.log("login-post");
    const username = req.body.username;
    const password = req.body.password
    let allow = true;
    const findTheUser = async function(){
        TestUser.findOne({username:username},function(err,result){
            if(err){
                console.log(err);
                return false;
            }else{
                console.log(result);
                // return result;
                if(result){
                    if(result.password === password){
                        console.log("logging in");
                        req.session.userId = result._id;
                        req.session.cookie.maxAge = 6000;
                        req.session.save();
                        console.log(req.session.userId);
                        allow = true;
                    }else{
                        console.log("Incorrect Password");
                        allow = false;
                    }
             }else{
                 allow = false;
             }
            }
        });
        if(allow){
            res.redirect("/secret");
        }else{
            res.redirect("/");
        }
    }
    findTheUser();
})


app.get("/logout",(req,res)=>{
    req.session.destroy();
    console.log("Session destroyed");
    console.log(req.session);
    res.redirect("/");
})

app.listen(3000,function(){
    console.log("Server started at port 3000");
})