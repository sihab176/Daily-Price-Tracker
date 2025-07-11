const express=require('express')
const cors=require('cors')
require('dotenv').config()

const port= process.env.PORT || 3000
const app= express()

//middleware  
app.use(cors())
app.use(express.json())








const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.dgbpvrt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;



const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
    const db=client.db("LocalMarket")
    const userCollection= db.collection('users')
    const productCollection= db.collection('product')
    const advertisementsCollection= db.collection('advertisement')
    
  try {
     await client.connect();

// !=========================== USER POST API =============================>
     app.post("/users",async(req,res)=>{
        const email= req.body.email
        const existingUser= await userCollection.findOne({email})
        if(existingUser){
            return res.status(200).send({message: "already exist"})
        }
        const user =req.body
        const result= await userCollection.insertOne(user)
        res.send(result)
     })

//!=========================== PRODUCT =====================================>
  // post the product =====>
      app.post("/products", async (req, res) => {
       const product = req.body;
       const result = await productCollection.insertOne(product);
       res.send(result);
     });
  // get product ==========>
      // app.get("/products",async(req,res)=>{
      //   const result= await productCollection.find().toArray()
      //   res.send(result)
      // })
  // get all product =======>
    app.get("/products", async (req, res) => {
      const { status, limit } = req.query;
      // console.log(status, limit);

     const query = { status: status || "pending" };
      const result = await productCollection
      .find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit || "10")) // fallback value if limit not given
      .toArray(); // ✅ convert cursor to array

       res.send(result); // ✅ now it's pure JSON
     });

//! ============================ vendor =====================================>

 //  GET all products for a specific vendor
 app.get("/products/vendor/:email", async (req, res) => {
       const email = req.params.email;
       const result = await productCollection.find({ vendorEmail: email }).toArray()
       res.send(result);
     });

// UPDATE method vendors post=> 
 app.put("/vendors/:id", async (req, res) => {
     try {
        const id = req.params.id;
        const updatedData = req.body;

        const result = await productCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
        );

     if (result.modifiedCount > 0) {
        res.status(200).send({ message: "Vendor updated successfully" });
       } else {
       res.status(404).send({ message: "Vendor not found or no changes" });
      }
  } catch (error) {
    res.status(500).send({ error: "Failed to update vendor", details: error });
    console.log(error);
  }
});
// DELETE a product by ID=>
app.delete("/products/:id", async (req, res) => {
       const id = req.params.id;
       const query= { _id: new ObjectId(id) }
 
       const result = await productCollection.deleteOne(query);
       res.send(result);
 });
// Todo: ADVERTISEMENT RELATED API ===============>
// POST advertisements ===>  
app.post("/advertisements", async (req, res) => {
  const ad = req.body;
  ad.status = "pending"; // just in case
  const result = await advertisementsCollection.insertOne(ad);
  res.send(result);
});
// GET advertisements ====>
 app.get("/advertisements", async (req, res) => {
  const email = req.query.vendor;
  const result = await advertisementsCollection.find({ vendorEmail: email }).toArray();
  res.send(result);
});
// UPDATE advertisements =>
app.put("/advertisements/:id", async (req, res) => {
  const { id } = req.params;
  const updated = req.body;
  const result = await advertisementsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updated }
  );
  res.send(result);
});






// todo: =================================================================================================>
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

  }
}
run().catch(console.dir);









app.get("/",(req,res)=>{
    res.send("welcome to local market")
})
app.listen(port,()=>{
    console.log(`server is running on port ${port}`);
})