const jwt = require("jsonwebtoken");
const session = require('express-session');
const { MongoClient, ObjectId } = require('mongodb');

const mongoUri =
  "mongodb+srv://dba:xpdcq2gYNSFJfD@cluster0.iflku.mongodb.net/dba?retryWrites=true&w=majority";
const client = new MongoClient(mongoUri, {
  useNewUrlParser: true
});

const db = client.db('dba');
const express = require("express");
const app = express();
var user_session;

// to make sure you send html files with external css files
app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname));
// to make sure you can read psot body.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(session({secret:'sumitsecret'}))

function authMiddleware(req,res,next) {
  let user_session=req.session
  //userIsNotLoggedIn = true
  if(!user_session._id){
   return res.render('unauthorized');

  }
  
  next();
 
}
app.get("/logout", (req, res) => {
  let user_session=req.session;
  delete user_session._id;
  res.render('logout');
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/users", async (req, res) => {
  const db = client.db("dba");
  const users = await db.collection("people").find().toArray();
  res.send(users)
});

app.get("/signup", (req, res) => {
  res.sendFile(__dirname + "/signup.html");
});

app.get("/signin", (req, res) => {
  res.sendFile(__dirname + "/signin.html");
});

app.get("/todo/delete/:id", async (req, res) => {
  var id = new ObjectId(`${req.params.id}`);
  await db.collection("todos").deleteOne({ _id: id }).then(async data => {
    res.redirect('/todo')
  })

})

app.get("/todo/edit/:id", async (req, res) => {
  try {
    let data = []
    await db.collection("todos").findOne({ _id: ObjectId(`${req.params.id}`) }).then(dt => {
      data = dt
    })
    console.log(data);
    res.render('edit', { data })
  } catch (error) {
    console.log(`error==>`, error)
  }
})


app.post("/todo/edit/:id", async (req, res) => {
  try {
    let data = req.body;
    await db.collection("todos").updateOne({ _id: ObjectId(`${req.params.id}`) }, {$set : { "content" : req.body.content }})
    res.redirect('/todo')
  } catch (error) {
    console.log(`error==>`, error)
  }
})

app.get("/todo", authMiddleware, async (req, res) => {
  const todos = await db.collection("todos").find({userId:req.session._id}).toArray();
  res.render('todo', { todos });
});

app.get("/aftercreatinganacc", (req, res) => {
  res.sendFile(__dirname + "/aftercreatinganacc.html");
});

app.post("/signup", (req, res) => {
  req.body.psw = jwt.sign(req.body.psw, "secret");
  delete req.body["psw-repeat"];
  db.collection("people").insertOne(req.body);
  res.redirect("/aftercreatinganacc");

  res.end();
});

app.post("/signin", async (req, res) => {
  req.body.psw = jwt.sign(req.body.psw, "secret");
  const db = client.db("dba");
  const userExists = await db
    .collection("people")
    .findOne({ email: req.body.uname, psw: req.body.psw });
    user_session=req.session;
    user_session._id=userExists._id
  if (!userExists) {
    return res.status(401).send("Username or password is wrong \n");
  }
  // cookie /session/local storage logic comes here.
  
  res.redirect("/todo");
});

app.post("/todo", (req, res) => {
  req.body.userId=req.session._id
  db.collection("todos").insertOne(req.body);
  res.redirect("/todo");
  res.end();
});



client.connect((err) => {
  console.log(`err ==>`, err);
  app.listen(8000, () => {
    console.log(`Serving at http://localhost:8000`);
  });
});