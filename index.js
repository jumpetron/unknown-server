const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();


const corsOptions = {
  origin: 'https://unknown-client-xi.vercel.app',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
//middleware
app.use(express.json());
app.use(cors(corsOptions));

//port
const port = 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cmta1vm.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const database = client.db("allProducts").collection("products");
    const orderData = client.db("allProducts").collection("orders");

    app.get("/orders", async (req, res) => {
      let query = {};
      if (req.query.email) {
        query = { email: req.query.email };
      }
      const orders = orderData.find(query);
      const result = await orders.toArray();
      res.send(result);
    });

    app.get("/products", async (req, res) => {
      const products = database.find();
      const result = await products.toArray();
      res.send(result);
    });

    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await database.findOne(query);
      res.send(result);
    });

    app.get("/product/update/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await database.findOne(query);
      res.send(result);
    });

    app.post("/products", async (req, res) => {
      const newProduct = req.body;
      const {
        productName,
        brandName,
        productPhoto,
        productQty,
        productType,
        category,
        shortDescription,
        fullDescription,
        price,
        rating,
        reviewPeople,
      } = newProduct;
      const product = {
        brand: brandName,
        name: productName,
        type: productType,
        category: category,
        price: price,
        shortDescription,
        fullDescription,
        image: productPhoto,
        review: {
          rating: rating,
          people: reviewPeople,
        },
        qty: productQty,
      };

      const result = await database.insertOne(product);
      res.send(result);
    });

    app.get("/:brandName", async (req, res) => {
      const brandName = req.params.brandName;
      // const result = database.find({ brand: brandName });
      const result = database.find({
        $or: [{ brand: brandName }, { category: brandName }],
      });
      const finalResult = await result.toArray();
      res.send(finalResult);
    });

    app.post("/new-orders", async (req, res) => {
      const newOrder = req.body;
      const result = await orderData.insertOne(newOrder);
      res.send(result);
    });

    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await orderData.deleteOne(query);
      res.send(result);
    });

    app.put("/products/:id", async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const product = req.body
      const options = { upsert: true };
      const updatedProduct = {
        $set: {
          brand: product.brandName,
          name: product.productName,
          type: product.productType,
          category: product.category,
          price: product.price,
          shortDescription:product.shortDescription,
          fullDescription: product.fullDescription,
          image: product.productPhoto,
          review: {
            rating: product.rating,
            people: product.reviewPeople,
          },
          qty: product.productQty,
        }
      };
    
      const result = await database.updateOne(filter,updatedProduct, options )
      res.send(result)
    });

  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
