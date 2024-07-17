const path = require('path')
const express = require('express')
const mongoose = require('mongoose')
const app = express()

// connect db
mongoose.connect('mongodb://127.0.0.1/shop_db')
.then(res => console.log('connected to mongodb'))
.catch(err => console.log(err))

app.set('views',path.join(__dirname,'views'))
app.set('view engine','ejs')


app.get('/',(req,res) => {
    res.send('hello world')
})

app.listen(3000, () => {
    console.log('Listening on port 3000')
})