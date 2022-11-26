const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

        // get products
        app.get('/products', async(req, res) =>{
            const query = {};
            const result = await productsCollections.find(query).toArray();
            res.send(result);
        });

        // get products email query
        app.get('/products', async(req, res) =>{
            const email = req.query.email;
            const query = {email: email};
            const result = await productsCollections.find(query).toArray();
            console.log('email')
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
                    isVerify: 'verify'
                }
            };
            const result = await usersCollections.updateOne(query, updatedDoc, option);
            res.send(result);
        });

        // query email and get users info
        // app.get('/users', async(req, res) =>{
        //     const query = req.query.email;
        //     console.log(query);
        //     const filter = {email: email};
        //     const result = await usersCollections.findOne(filter);
        //     res.send(result);

        // })

        app.get('/users/admin/:email', async(req, res) =>{
            const email = req.params.email;
            const query = {email};
            const user = await usersCollections.findOne(query);
            res.send({isAdmin: user?.role === 'admin'});
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


