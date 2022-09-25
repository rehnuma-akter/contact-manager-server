const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const jwt = require("jsonwebtoken");
const ObjectId = require("mongodb").ObjectId;
const port = process.env.PORT || 5000;

//Using the Middleware ---
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jebpgu9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const contactsCollection = client
      .db("contactsCollection")
      .collection("contacts");
    // AUTH
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ accessToken });
    });
    //Fetch all the contacts
    app.get("/contacts", async (req, res) => {
      const query = {};
        const contacts = await contactsCollection.find(query).toArray();
      res.send(contacts);
    });
    // Fetch contact via id
    app.get("/contacts/:id", async (req, res) => {
      const contactId = req.params.id;
      const query = { _id: ObjectId(contactId) };
      const contact = await contactsCollection.findOne(query);
      res.send(contact);
    });
    //Add a contact
    app.post("/contacts", async (req, res) => {
      const contact = req.body;
      const newContact = await contactsCollection.insertOne(contact);
      res.send(newContact);
    });
    //update a contact
    app.put("/contacts/:id", async (req, res) => {
      const contactId = req.params.id;
      const contact = req.body;
      const query = { _id: ObjectId(contactId) };
      const updatedContact = await contactsCollection.updateOne(query, {
        $set: contact,
      });
      res.send(updatedContact);
    });
    //Delete a contact
    app.delete("/contacts/:id", async (req, res) => {
      const contactId = req.params.id;
      const query = { _id: ObjectId(contactId) };
      const deletedContact = await contactsCollection.deleteOne(query);
      res.send(deletedContact);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to Server Side");
});

app.listen(port, () => {
  console.log(`The server is listening on port ${port}`);
});
