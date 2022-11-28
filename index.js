const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require("stripe")(process.env.STRIPE_KEY);
const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uqseuad.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT (req, res, next){
    const authHeaders =  req.headers.authorization;
    if(!authHeaders){
        return res.status(401).send({message: 'unauthorized access'})
    }
    const token = authHeaders.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded) {
        if(err){
            return res.status(403).send({message: 'forbidden access'})
        }
        req.decoded = decoded;
        next();
    })
}

async function run(){
    try{
        const usersCollections = client.db('resaleMarket').collection('users');
        const productsCollections = client.db('resaleMarket').collection('products');
        const categoryCollections = client.db('resaleMarket').collection('names');
        const ordersCollections = client.db('resaleMarket').collection('orders');
        const reportedCollections = client.db('resaleMarket').collection('reported')
        const paymentsCollections = client.db('resaleMarket').collection('payment')
        const advertisedCollections = client.db('resaleMarket').collection('advertise')
        
        
        // create user
        app.post('/users', async(req, res) =>{
            const user = req.body;
            const result = await usersCollections.insertOne(user);
            res.send(result);
        });

        // post products
        app.post('/products', async(req, res) =>{
            const products = req.body;
            const result = await productsCollections.insertOne(products);
            res.send(result);
        })
        
        // get category name
        app.get('/category', async(req, res) =>{
            const query = {};
            const category = await categoryCollections.find(query).toArray();
            res.send(category);
        });

        // get specific category data
        app.get('/products/:category_id', async(req, res) =>{
            const filter = req.params.category_id;
            const query = {category_id: filter};
            const result = await productsCollections.find(query).toArray();
            res.send(result);
        });

        // get specific user added product 
        app.get('/products', async(req, res) =>{
            const email = req.query.email;
            const filter = {email: email};
            const result = await productsCollections.find(filter).toArray();
            res.send(result);
        });

        app.delete('/products/:id', async(req, res) =>{
            const id = req.params.id;
            const filter = {_id: ObjectId(id)};
            const result = await productsCollections.deleteOne(filter);
            res.send(result);
        })

        // order create
        app.post('/orders', async(req, res) =>{
            const query = req.body;
            const order = await ordersCollections.insertOne(query);
            res.send(order);
        })

        app.get('/orders',  async(req, res) =>{
            const email = req.query.email;
            // const decodedEmail = req.decoded.email;
            // console.log(email, decodedEmail)
            // if(email !== decodedEmail){
            //     return res.status(403).send({message: 'forbidden access'}); 
            // }
            const query = {userEmail: email};
            const result = await ordersCollections.find(query).toArray();
            res.send(result);
        })

        // jwt token
        app.get('/jwt', async(req, res) =>{
            const email = req.query.email;
            const query = {email: email};
            const user = await usersCollections.findOne(query);
            if(user){
                const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '1h'});
                return res.send({accessToken: token})
            }
            res.status(403).send({accessToken: ''})
        })

        // get all users
        app.get('/users', async(req, res) =>{
            const query = {};
            const result = await usersCollections.find(query).toArray();
            res.send(result);
        })

        // get seller
        app.get('/users/:id', async(req, res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await usersCollections.findOne(query);
            res.send(result);
        });

        // delete users 
        app.delete('/users/:id', async(req, res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)}; 
            const result = await usersCollections.deleteOne(query);
            res.send(result);
        });

        // verify users
        app.put('/users/:id', async(req, res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const option = {upsert: true};
            const updatedDoc = {
                $set: {
                    isVerify: true
                }
            };
            const result = await usersCollections.updateOne(query, updatedDoc, option);
            res.send(result);
        });

        // admin route
        app.get('/users/admin/:email', async(req, res) =>{
            const email = req.params.email;
            const query = { email:email};
            const user = await usersCollections.findOne(query);
            res.send({isAdmin: user?.role === 'admin'});
        })

        // bayer route 
        app.get('/users/bayer/:email', async(req, res) =>{
            const email = req.params.email;
            const query = {email};
            const user = await usersCollections.findOne(query);
            res.send({isBayer: user?.role === 'Bayer'});
        });

        // seller route
        app.get('/users/seller/:email', async(req, res) =>{
            const email = req.params.email;
            const query = {email};
            const user = await usersCollections.findOne(query);
            res.send({isSeller: user?.role === 'Seller'});
        });

        // reported items
        app.post('/report', async(req, res) =>{
            const product = req.body;
            const result = await reportedCollections.insertOne(product);
            res.send(result);
        });
        
         // reported deleted items
         app.delete('/report/:id', async(req, res) =>{
            const id  = req.params.id;
            const query = {product_id: id};
            const result = await reportedCollections.deleteOne(query);
            res.send(result);
         })

        // reported items get
        app.get('/report', async(req, res) =>{
            const query = {};
            const report = await reportedCollections.find(query).toArray();
            res.send(report);
        });

        // payment 
        app.get('/orders/:id', async(req, res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const order = await ordersCollections.findOne(query);
            res.send(order);
        });

        // stripe payment
        app.post('/create-payment-intent', async(req, res) =>{
            const order = req.body;
            const price = order.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: "usd",
                amount: amount,
                "payment_method_types": [
                    "card"
                ],
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        // payment successfully transition info
        app.post('/payments', async(req, res) =>{
            const payment = req.body;
            const result = await paymentsCollections.insertOne(payment);
            const id = payment.ordersId;
            const filter = {_id: ObjectId(id)};
            const updatedDoc = {
                $set: {
                    paid: true,
                    transitionId: payment.transitionId,
                }
            };
            const updatedResult = await ordersCollections.updateOne(filter, updatedDoc);
            const productId = payment.productId;
            const productFilter = {_id: ObjectId(productId)};
            const updatedProductDoc = {
                $set:{
                    isAdd: true
                }
            };
            const productResult = await productsCollections.updateOne(productFilter, updatedProductDoc);
            
            const advertiseFilter = {product_id: productId};
            const updatedAdvertise = {
                $set:{
                    isPaid: true
                }
            }
            const advertiseResult = await advertisedCollections.updateOne(advertiseFilter, updatedAdvertise);
            res.send(result);
        });


        // add products on advertised
        app.post('/advertise', async(req, res) =>{
            const advertise = req.body;
            const result = await advertisedCollections.insertOne(advertise);
            res.send(result);
        });

        // get advertised 
        app.get('/advertise', async(req, res) =>{
            const query = {};
            const advertise = await advertisedCollections.find(query).toArray();
            res.send(advertise);
        })
       

    }
    finally{

    }
}
run().catch(error => console.error(error))



app.get('/', (req, res) =>{
    res.send('port is running');
});

app.listen(port, () => console.log(`port is running on ${port}`));


