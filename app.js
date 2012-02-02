var cloudfoundry = require("cloudfoundry");
var mongoose = require("mongoose");
var express = require("express");

var Schema = mongoose.Schema;
var PersonSchema = new Schema({
  name: { type: String },
  age: { type: Number }
});
mongoose.model('Person', PersonSchema);

var props = cloudfoundry.getServiceConfig("mongo");
var db = mongoose.createConnection("mongo://" + props.username + ":" + props.password + "@" + props.hostname + ":" + props.port + "/" + props.db);
var Person = db.model('Person', 'people');

var app = express.createServer();

app.configure(function() {
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(app.router);	
  if(!cloudfoundry.isRunningInCloud()) {
    app.use(express.errorHandler({dumpExceptions: true, showStack: true}));
  }
});

app.get("/", function(req, res) {
  Person.find({}, function(err, data) {
    if (err) { throw(err); }
    res.send(JSON.stringify(data));
  });
});

app.get("/:id", function(req, res) {
  Person.findById(req.params.id, function(err, data) {
    if (err) { throw(err); }
    res.send(JSON.stringify(data));
  });
});

app.post("/", function(req, res) {
  if (req.headers['content-length'] <= 0) {
    res.send(400);
  }
  else {
    console.log("creating: " + JSON.stringify(req.body));
    var person = new Person(req.body);
    person.save(function(err) {
      if (err) { throw err; }
      res.contentType('application/json');
      res.send(201);
    });
  }
});

app.listen(cloudfoundry.getAppPort());
