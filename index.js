const express = require('express')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const cors = require('cors')
const path = require('path')
const { type } = require('os')
const connectDB = require('./DataBase/database')
const { configDotenv } = require('dotenv')
require('dotenv').config()


const app = express();

app.use(express.json())
app.use(cors())

// connect mongodb
// mongoose.connect("mongodb://bantu8120:bantu8120@ac-cnqzbig-shard-00-00.z6von2p.mongodb.net:27017,ac-cnqzbig-shard-00-01.z6von2p.mongodb.net:27017,ac-cnqzbig-shard-00-02.z6von2p.mongodb.net:27017/?ssl=true&replicaSet=atlas-axc2z1-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0")
connectDB();

app.get('/', (req, res) => {
    res.send("Server is running")
})

// port = 8000

app.listen( process.env.PORT , (err) => {
    if (!err) {
        console.log(`Server Listing on Port : ${process.env.PORT} `);
    } else{
        console.log(`Error : ${err}`);
    }
})



// store images using multer

const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})
const upload = multer({storage: storage})

// creating endpoint for images
app.use('/images', express.static('upload/images'))

app.post('/upload', upload.single('product'), (req, res) => {
    res.json({
        success: true,
        image_url: `http://localhost:${port}/images/${req.file.filename}`
    })
})


const Product = mongoose.model("Product", {
    id: {
        type: Number,
        require: true,
    },
    name: {
        type: String,
        require: true
    },
    image: {
        type: String,
        require: true
    },
    category: {
        type: String,
        require: true,
    },
    new_price:{
        type: Number,
        require: true
    },
    old_price: {
        type: Number,
        require: true
    },
    date: {
        type: Date,
        default: Date.now,
    },
    available:{
        type: Boolean,
        default: true
    },
})

app.post('/addproduct', async(req , res) => {
    let products = await Product.find({})
    let id
    if (products.length>0) {
        let last_product_array = products.slice(-1)
        let last_product = last_product_array[0]
        id = last_product.id + 1
    } else{
        id = 1;
    }
    const product = new Product({
        id: id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
    })
    console.log(product);
    await product.save();
    console.log("saved");
    res.json({
        success: true,
        name: req.body.name,
    })
})


app.post('/removeproduct', async (req, res) => {
    await Product.findOneAndDelete({id: req.body.id})
    console.log('removed product');
    res.json({
        success: true,
        name: req.body.name
    })
})

app.get('/allproduct', async(req, res) => {
    let product = await Product.find({})
    console.log("all product fetch")
    console.log(product)
    res.send(product)
})

// Schema for creating User Model

const User = mongoose.model('User', {
    name: {
        type: String
    },
    email:{
        type: String,
        require: true
    },
    password:{
        type: String,
        required: true
    },
    cartData: {
        type: Object,
    },
    date: {
        type: Date,
        default: Date.now
    }

})

// collect new product data 
app.get('/newcollections', async(req, res) => {
    let products = await Product.find({});
    let newCollection = products.slice(1).slice(-8);
    console.log('new Collection Fetched');
    res.send(newCollection);
})

// collect populer product data 
app.get('/populerproducts', async(req, res) => {
    let products = await Product.find({ category: 'clothing' });
    let populerProducts = products.slice(0, 4);
    console.log('populerproducts Fetched');
    res.send(populerProducts);
}) 


// creating middleware for fetch user 

const fetchUser = async(req, res, next) => {
    const token = req.header('auth-token')
    if (!token) {
        res.status(401).send({
            errors: "Please Authenticate using valid Login"
        })
    } else{
        try {
            const data = jwt.verify(token, 'secret_ecom')
            req.user = data.user
            next();
        } catch (error) {
            res.status(401).send({
                errors: 'Please authenticate using valid token'
            })
        }
    }
}


// creating endpoint for adding product in cartdata

app.post('/addtocart', fetchUser, async(req, res) => {
    console.log('add id ', req.body.itemId);
    let userData = await User.findOne({_id: req.user.id})
    userData.cartData[req.body.itemId] += 1
    await User.findOneAndUpdate({_id: req.user.id}, {cartData: userData.cartData})
    res.send("Added")
})


app.post('/removefromcart', fetchUser, async(req, res) => {
    console.log('remove id ', req.body.itemId);
    let userData = await User.findOne({_id: req.user.id})
    if (userData.cartData[req.body.itemId] > 0) {
        userData.cartData[req.body.itemId] -= 1
        
    }
    await User.findOneAndUpdate({_id: req.user.id}, {cartData: userData.cartData})
    res.send("Remove")
})


app.post('/getcart', fetchUser, async(req, res) => {
    console.log('get cart');
    let userData = await User.findOne({_id: req.user.id})
    res.json(userData.cartData)
})



// const user = require("./controller/user")

// app.use("/api/user", user)


app.post('/signup', async(req, res) => {
    let Check = await User.findOne({email: req.body.email})
    if (Check) {
        return res.status(400).json({
            success: false,
            errors: "User Alardy Exit"
        })
    }
    let cart = {}
    for(let i = 0; i < 300; i++){
        cart[i] = 0
    }

    const user = new User({
        name: req.body.name,
        email:req.body.email,
        password:req.body.password,
        cartData: cart,
    })

    await user.save();

    const data = {
        user: {
            id: user.id,
        }
    }
    const token = jwt.sign(data, "secret_ecom")
    res.json({ success: true, token })
})

// user login endpoint

app.post('/login', async(req, res) => {
    let user = await User.findOne({
        email: req.body.email
    })
    if (user) {
        const passMatch = req.body.password === user.password
        if (passMatch) {
            const data = {
                user: {
                    id: user.id,
                }
            }
            const token = jwt.sign(data, "secret_ecom")
            res.json({success: true, token})
        } else{
            res.json({
                success: false,
                errors: "Wrong Password"
            })
        }
    } else{
        res.json({
            success: false,
            errors: "Wrong Email Address."
        })
    }
})