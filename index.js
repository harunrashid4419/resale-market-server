const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uqseuad.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        const usersCollections = client.db('resaleMarket').collection('users');
        const productsCollections = client.db('resaleMarket').collection('products');
        const categoryCollections = client.db('resaleMarket').collection('names');

        // create user
        app.post('/users', async(req, res) =>{
            const user = req.body;
            const result = await usersCollections.insertOne(user);
            console.log(result);
            res.send(result);
        });

        // get products
        app.get('/products', async(req, res) =>{
            const query = {};
            const result = await productsCollections.find(query).toArray();
            res.send(result);
        });
        
        // get category name
        

    }
    finally{

    }
}
run().catch(error => console.error(error))



app.get('/', (req, res) =>{
    res.send('port is running');
});

app.listen(port, () => console.log(`port is running on ${port}`));


