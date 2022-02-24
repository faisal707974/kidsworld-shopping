var express = require('express');
var router = express.Router();
const userHelpers = require('../helpers/user/userHelpers');
const productHelpers = require('../helpers/user/productHelpers');

const accountSid = 'ACe7bc5c1bcc58d49a73aba31992667ace'; // Your Account SID from www.twilio.com/console
const authToken = 'b6afb1bd2447e30773fdf7895e8c80ae'; // Your Auth Token from www.twilio.com/console

const twilio = require('twilio');
const client = new twilio(accountSid, authToken);


// {----- Home page -----}

router.get('/', async function (req, res, next) {
  let cartCount
  if(req.session.user){
    cartCount = await productHelpers.cartCount(req.session.user._id)
  }

  productHelpers.getProducts().then((response) => {
    res.render('users/home', {
      css: 'user/home',
      css1: 'user/horizontal-scroll',
      css2: 'user/navbar',
      js: 'user/home/horizontal-scroll',
      status: req.session.userLoggedIn,
      products: response,
      cartCount: cartCount
    })
  })
});

// {----- Page -- Login -----}

router.get('/login', (req, res, next) => {
  res.render('users/login', {
    css: 'user/loginLayout'
  })
})


// {----- Button -- Request OTP -----}


var otp
var mobileNumber;

router.post('/otpRequest', (req, res) => {
  mobileNumber = req.body.mobileNumber
  otp = Math.floor(Math.random() * 9999) + 1001;
  res.redirect('/otpRequest?mobileNumber=' + mobileNumber)
})


// {----- Page -- OTP entering -----}


router.get('/otpRequest', (req, res, next) => {
  // if(!req.query.mobileNumber){
  //   res.redirect('/login')
  // }
  mobileNumber = req.query.mobileNumber
  userHelpers.checkNumber(req.query.mobileNumber).then((response) => {
    if (response) {
      if (response.block) {
        res.redirect('/login')
      } else {
        req.session.userExist = true;
        req.session.user = response
        res.render('users/otpVerify', {
          css: 'user/loginLayout',
          number: mobileNumber,
          userExist: true
        })
      }
 
    } else {
      req.session.userExist = false;
      res.render('users/otpVerify', {
        css: 'user/loginLayout',
        number: mobileNumber,
        userExist: false
      })
    }

    console.log(otp)

    client.messages.create({
      body: otp+' is your One Time Password to sign up to Kids World online shopping application',
      to: mobileNumber,// Text this number
      from: '+19125285863', // From a valid Twilio number
    })
    .then((message) => console.log(message.sid));
 
  })
})


// {----- Button -- verify otp -----} 

router.post('/otpVerify', async (req, res, next) => {

  if (req.body.otp == otp) {
    req.session.userLoggedIn = true
    req.session.mobileNumber = mobileNumber
    if (req.session.userExist == false) {
      const response = await userHelpers.saveNumber(mobileNumber)
      req.session.user = {}
      req.session.user._id = response
    }
    res.redirect('/')
  } else {
    res.redirect('/otpRequest?mobileNumber=' + mobileNumber)
  }
})


// {----- sign out icon -----}

router.get('/signout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})


// {----- Page -- Cart -----}

router.get('/cart',cartPage)

async function cartPage (req, res){
  if(req.session.user==undefined ){
    res.redirect('/login')
  }else{

    let cartProducts = await productHelpers.getCartProducts(req.session.user._id)
    let count =  await productHelpers.cartProductsCount(req.session.user._id)
    let cartTotal = await productHelpers.cartTotal(req.session.user._id)
     res.render('users/cart', {
       css: 'user/navbar',
       css1: 'user/cart',
       products: cartProducts,
       count:count[0]?.products.length,
       cartTotal : cartTotal[0]?.total,
       user: req.session.user
      })
    }
}



// {----- Page -- profile -----}

router.get('/profile',profilePage)


function profilePage (req, res){
  let number = req.session.mobileNumber
  if (req.session.userLoggedIn) {
    userHelpers.getUser(number).then((response) => {
      res.render('users/profile', {
        css: 'user/navbar',
        css1: 'user/profile',
        status: req.session.userLoggedIn,
        user: response[0]
      })
    })
  } else {
    res.redirect('/')
  }
}


router.get('/viewProduct/:id', (req, res) => {
  productHelpers.getProduct(req.params.id, (data) => {
    res.render('users/viewProduct', {
      css: 'user/navbar',
      css1: 'user/viewProduct',
      product: data[0]
    })
  })
})


router.post('/updateUser', (req, res) => {
  userHelpers.updateUser(req.body).then((response) => {
  })
  res.redirect('/profile')
 
})


router.get('/addcart/:id', (req, res) => {
  if (req.session.user) {
    let userId = req.session.user._id
    productHelpers.insertCart(userId, req.params.id)
    res.json({status:true})
  } else{
    res.json({status:false})
  }
})


router.post('/change-product-quantity',async (req,res)=>{
  let cartTotal = await productHelpers.cartTotal(req.session.user._id)
  let response = await productHelpers.changeProductQuantity(req.body)
  if(response==1){
    res.json({
      status : true,
      cartTotal : cartTotal[0].total
    }) 
  }
  productHelpers.changeProductTotalPrice(req.body)
})


router.post('/deleteCartItem',(req,res)=>{
  productHelpers.deleteCartItem(req.body).then((response)=>{
    res.json({
      status : true,

    })
  })
})


router.post('/place-order',async(req,res)=>{
  let products = await productHelpers.getCartProductList(req.body.userId)
  let totalPrice = await productHelpers.cartTotal(req.session.user._id)
  productHelpers.placeOrder(req.body,products,totalPrice[0].total).then((orderId)=>{
    if(req.body['payment']==='cod'){
      res.json({
        codStatus: true
      })
    }else{
      
      productHelpers.generateRazorpay(orderId,totalPrice[0].total).then((response)=>{
        res.json(response)
      })
    }
  })
})


router.get('/orderView',async(req,res)=>{
  if(req.session.user){
    let orders = await productHelpers.getOrders(req.session.user._id)

    res.render('users/ordersView',{
      css: 'user/navbar',
      css1:'user/orderView',
      orders:orders
    })
  }else{
    res.redirect('/login')
  }
})


router.post('/verify-payment',(req,res)=>{
  productHelpers.verifyPayment(req.body).then(()=>{
    productHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      res.json({
        status: true
      })
    }).catch((err)=>{
      res.json({
        status: false
      })
    })
  })
})

router.get('/test',async(req,res)=>{
  productHelpers.generateRazorpay()
})

 
module.exports = router;


