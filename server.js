const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
var multer = require('multer');
var upload = multer();

require('dotenv').config()

app.use(cors())


app.use(bodyParser.urlencoded({ extended: true })); 

app.use(upload.array()); 
app.use(express.static('public'))

mongoose.connect("mongodb+srv://OmarAbuRish:hbxLRLCbKARXZSvZ@cluster0.2ywuh.mongodb.net/ExerciseTracker?retryWrites=true&w=majority" )

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  }
})

userSchema.virtual('log' ,  {
  ref : "Exercise" ,
  localField: "_id" ,
  foreignField : 'userId'
})

const User = mongoose.model('User' , userSchema)

const exerciseSchema = mongoose.Schema({
  userId :{
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
  }, 
  duration: {
    type: Number,
    required : true
  }
})


const Exercise = mongoose.model('Exercise' , exerciseSchema)


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/exercise/new-user" , async (req , res) => {
  try {
    const newUser = new User({username:  req.body.username})
    await newUser.save()
    res.send(newUser)
  } catch(e) {
    res.send("username already taken")
  }
})

app.get("/api/exercise/users" , async (req, res) => {
  try {
    const users = await User.find({})
    res.send(users)
  } catch (e) {
    res.status(500).send()
  }
})

app.post("/api/exercise/add" , async (req,res) => {
  try {
    let parsedDate = new Date(req.body.date)

    console.log(req.body)
    const exercise = new Exercise({
      userId: req.body.userId,
      description: req.body.description,
      duration: req.body.duration,
      date: (parsedDate != "Invalid Date")? parsedDate : Date.now()
    })
    await exercise.save()
    await exercise.populate('userId').execPopulate()
    // let outputDate = exercise.date.toLocaleString("en-us" ,{ weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' ,formatMatcher:"basic"})
    // console.log(outputDate)
    console.log({
      _id: exercise._id,
      username: exercise.userId.username,
      date: exercise.date.toDateString(),
       duration : exercise.duration,
      description: exercise.description
    })

    res.send({
      _id: exercise.userId._id,
      username: exercise.userId.username,
      date: exercise.date.toDateString(),
       duration : exercise.duration,
      description: exercise.description
    })
  } catch(e) {
    res.send(e)
  }
})

app.get("/api/exercise/log" , async (req ,res) => {
  try {
    const foundUser = await User.findById(req.query.userId)
    
    if(!foundUser) {
      res.status(404).send("Not found")
    }

    await foundUser.populate('log').execPopulate()

    
    // Implementing Filters 
    let fromDate = new Date(req.query.from)
    let toDate = new Date(req.query.to)
    let limit = req.query.limit

    let log = foundUser.log


    log = log.filter((exercise) => {
      if(fromDate != undefined && exercise.date < fromDate) {
        return false;
      } else if (toDate != undefined && exercise.date > toDate) {
        return false;
      } else {
        return true;
      }
    })

    if(limit && limit < log.length) {
      log = log.splice(0,limit)
    }
    
   
    res.send({
      _id:foundUser._id , 
      username: foundUser.username , 
      count: foundUser.log.length ,
      log: log
    })
  } catch(e) {
    res.status(500).send(e)
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
