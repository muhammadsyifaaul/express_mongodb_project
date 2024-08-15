const path = require('path')
const express = require('express')
const methodOverride = require('method-override')
const mongoose = require('mongoose')
const app = express()
const ErrorHandler = require('./ErrorHandler')



// models
const Product = require('./models/product')

// connect db
mongoose.connect('mongodb://127.0.0.1/shop_db')
.then(res => console.log('connected to mongodb'))
.catch(err => console.log(err))

app.set('views',path.join(__dirname,'views'))
app.set('view engine','ejs')
app.use(express.urlencoded({extended: true}))
app.use(methodOverride('_method'))

function wrapAsync(fn) {
    return function(req, res, next) {
        fn(req, res, next).catch(err => next(err));
    }
}

app.get('/products/:id', wrapAsync( async(req, res, next) => {
    const { id } = req.params;
    
    // Cek validitas ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler(400, 'Invalid product ID'));
    }

    try {
        const product = await Product.findById(id);
        if (!product) {
            return next(new ErrorHandler(404, 'Product not found'));
        }
        res.render('products/show', { product });
    } catch (error) {
        next(error); // Tangani error lain yang mungkin terjadi selama pencarian
    }
    const product = await Product.findById(id)
    res.render('products/show',{product})
}));
app.get('/',(req,res) => {
    res.send('hello world')
})
app.post('/products', wrapAsync( async(req,res) => {
    const product = new Product(req.body)
    await product.save()
    res.redirect(`/products/${product._id}`)
}))
app.get('/products',async (req,res) => {
    const{category} = req.query
    if(category){
        const products = await Product.find({category})
        res.render('products/index', {products,category})
    } else {
        const products = await Product.find({})
        res.render('products/index', {products,category: 'All'})
    }

})
app.get('/products/create', (req,res) => {
    throw new ErrorHandler(503,'this is custom error')
    // res.render('products/create')
})





app.get('/products/:id/edit', wrapAsync( async(req,res,next) => {
    const {id} = req.params
    const product = await Product.findById(id)
    
    res.render('products/edit', {product})
    
}))

app.put('/products/:id',wrapAsync( async (req,res) => {
    const {id} = req.params
    const product = await Product.findByIdAndUpdate(id, req.body, {runValidators: true})

    res.redirect(`/products/${product._id}`)
}))

app.delete('/products/:id', wrapAsync( async(req,res) => {
    const {id} = req.params
    await Product.findByIdAndDelete(id)
    res.redirect('/products')
}))

const validatorHandler = err => {
    err.status = 400
    err.message = Object.values(err.errors).map(item => item.message)
    return new ErrorHandler(err.status, err.message)
}

app.use((err,req,res,next) => {
    console.dir(err)
    if(err.name === 'ValidationError') err= validatorHandler(err) //{ 
    //     err.status = 400
    //     err.message = Object.values(err.errors).map(item => item.message)
    // }
    if(err.name === 'CastError') {
        err.status = 404
        err.message = "Product Not Found"
    }
    next(err)
})

app.use((err,req,res,next) => {
    // const {status , message} = err
    // res.status(status).send(message)

        const status = err.status || 500; // default ke 500 jika status tidak tersedia
        const message = err.message || 'Internal Server Error'; // default pesan error
        res.status(status).send(message);

})

app.listen(3000, () => {
    console.log('Listening on port 3000')
})