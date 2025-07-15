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
    const reviewCollection=db.collection("reviews")
    const watchListCollection= db.collection("watchList")
    
  try {
     await client.connect();

// !=========================== USER  API ================================>
  // user Get Api ===========>
    app.get("/users",async(req,res)=>{
      const result =await userCollection.find().toArray()
      res.send(result)
    })

  // user Post Api ==========>
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
  // user update status =====>
app.patch("/users/:id", async (req, res) => {
  const id = req.params.id;
  const { role } = req.body; 

  // Validate input
  if (!role || !["Admin", "Vendor", "user"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    const result = await userCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          role: role,
          last_updated: new Date() // Optional: Track when role was changed
        }
      }
    );
    

   

    res.status(200).json({ success: true, updatedRole: role });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

//!=========================== PRODUCT =====================================>
  // post the product =========>
      app.post("/products", async (req, res) => {
       const product = req.body;
       const result = await productCollection.insertOne(product);
       res.send(result);
     });

  // get product ===============>
    app.get("/products", async (req, res) => {
      const { status, limit } = req.query;
      // console.log(status, limit);

     const query = { status: status || "pending" };
      const result = await productCollection
      .find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit || "10")) 
      .toArray(); 

       res.send(result); 
     });
  // product details ===========>
     app.get("/products/:id",async(req,res)=>{
    const id = req.params.id
    const query= {_id : new ObjectId(id)}
    const result= await productCollection.findOne(query)
    res.send(result)
     }) 

   // get all product ADMIN==========>

    app.get("/allProducts",async(req,res)=>{
      const {status,sort,date} = req.query
      const query = { status: status || "pending" };
      const sortDate= sort === "desc"  ? 1 : -1
      // query.data =date
      const result = await productCollection.find(query).sort({ pricePerUnit : sortDate}).toArray()
      
      // console.log(result ,"result");

      if(date){
         const filterResult= result.filter(singleData=> singleData.date == date )
         return res.send(filterResult)
       
        
      }
      else{
        return res.send(result)
      }
    })
  //TODO : ===================== ADMIN ======================================>
// Get all products (for admin)
  app.get("/admin/allProduct", async (req, res) => {
  const result = await productCollection.find().toArray();
  res.send(result);
});
// Approve product
app.patch("/admin/product/approve/:id", async (req, res) => {
  const result = await productCollection.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { status: "approved" } }
  );
  res.send(result);
});

app.patch("/admin/products/reject/:id",async(req,res)=>{
  const feedback= req.body
  const  result =await productCollection.updateOne({_id : new ObjectId(req.params.id)},
  {$set: {status : "rejected", rejectionFeedback : feedback}}
  
)
res.send(result)
})

// Delete Product
app.delete("/admin/products/:id", async (req, res) => {
  const result = await productCollection.deleteOne({ _id: new ObjectId(req.params.id) });
  res.send(result);
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
         delete updatedData._id;
       

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
// Todo: ======================  ADVERTISEMENT RELATED API ===================>
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
// DELETE advertisements =====>
  app.delete("/advertisements/:id", async (req,res)=>{
    const id= req.params.id
    const  query = {_id : new ObjectId(id)}
    const result = await advertisementsCollection.deleteOne(query)
    res.send(result)
  })
//! ============================== review collection =====================>
// post reviews ======>
  app.post("/reviews",async(req,res)=>{
    const query = req.body
    const result =await reviewCollection.insertOne(query)
    res.send(result)
  })
// get reviews ========>
 app.get('/reviews/:productId', async (req, res) => {
  const productId = req.params.productId;

  try {
    const query = { productId }; 
    const result = await reviewCollection.find(query).sort({ date: -1 }).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});


//  compare price with bar chart ==========>
  app.get("/compare-price", async (req, res)=>{

    const { productId, date } = req.query;
     const product = await productCollection.findOne({ _id: new ObjectId(productId),  });
     
     const newProduct=product.prices
     const findDate= newProduct.find(p=>p.date === date)
    const today = new Date().toISOString().split("T")[0];
    const findToCurrentDate= newProduct.find(p=>p.date === today)
  //  console.log(today);
    const findTheDate= findToCurrentDate ? findToCurrentDate :{ date: today, price: '0' }
    
    

    if (!findDate) {
      return res.status(404).send({ error: "Product not found" });
    }
    // console.log([findDate,findTheDate]);
    res.send([findDate,findTheDate])
  })

// ! ============================== watch List ============================>
// get  watch List ===========>
app.get("/watchlist",async(req,res)=>{
  const {email}= req.query
 
  const result= await watchListCollection.find({userEmail:email}).toArray()
  res.send(result)
})

// post watch List ============>
app.post("/watchlist",async(req,res)=>{
   const data= req.body
  // console.log(data);
   const query= data.productId
  
   const findData= await watchListCollection.findOne({productId :query})
  
    if(findData){
   return res.status(200).send({message: "already exist"})
 }
const result = await watchListCollection.insertOne(data)
  res.send(result)
})

app.delete("/watchlist/:id",async(req,res)=>{
  const id = req.params.id
  const query= {_id : new ObjectId(id)}
  const result= await watchListCollection.deleteOne(query)
  res.send(result)
  })



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