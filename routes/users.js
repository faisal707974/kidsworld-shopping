var express = require('express');
var router = express.Router();
const userHelpers = require('../helpers/user/userHelpers');
const productHelpers = require('../helpers/user/productHelpers');

const accountSid = 'ACe7bc5c1bcc58d49a73aba31992667ace'; // Your Account SID from www.twilio.com/console
const authToken = 'b6afb1bd2447e30773fdf7895e8c80ae'; // Your Auth Token from www.twilio.com/console

const twilio = require('twilio');
const { response } = require('express');
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
    let addresses = await userHelpers.getAddresses(req.session.user._id)
     res.render('users/cart', {
       css: 'user/navbar',
       css1: 'user/cart',
       products: cartProducts,
       count:count[0]?.products.length,
       cartTotal : cartTotal[0]?.total,
       user: req.session.user,
       addresses : addresses
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
  productHelpers.getProduct(req.params.id).then((data) => {
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


router.get('/addcart/:id', async(req, res) => {
  let product = await productHelpers.getProduct(req.params.id)
  if (req.session.user) {
    let userId = req.session.user._id
    productHelpers.insertCart(userId, req.params.id)
    res.json({status:true,product:product[0].name})
  } else{
    res.json({status:false})
  }
})


router.post('/change-product-quantity',async (req,res)=>{
  let response = await productHelpers.changeProductQuantity(req.body)
  productHelpers.changeProductTotalPrice(req.body)
  let cartTotal = await productHelpers.cartTotal(req.session.user._id)
  if(response==1){
    res.json({
      status : true,
      cartTotal : cartTotal[0].total
    }) 
  }
})


router.post('/deleteCartItem',(req,res)=>{
  productHelpers.deleteCartItem(req.body).then((response)=>{
    res.json({
      status : true,

    })
  })
})

router.post('/redeemcoupon',(req,res)=>{
  productHelpers.checkCoupon(req.body.coupon_code,req.session.user._id).then((response)=>{
    if(response){
      res.json({discount:response.discount})
      productHelpers.add_user_to_coupon(req.session.user._id,response._id)
      console.log(response)
    }else{
      res.json(null)
      console.log('resfalse')
    }
  })
})


router.post('/place_order',async(req,res)=>{
  let products = await productHelpers.getCartProductList(req.body.userId)
  // let totalPrice = await productHelpers.cartTotal(req.session.user._id)

  console.log('req.body')
  console.log(req.body)
  productHelpers.placeOrder(req.body,products,req.body.GrandTotal).then((orderId)=>{
    if(req.body.payment ==='cod'){
      console.log('cod if')
      res.json({
        codStatus: true
      })
    }else if(req.body.payment === 'razorpay'){ 
      console.log('razorpay if')
      productHelpers.generateRazorpay(orderId,req.body.GrandTotal).then((response)=>{
        res.json(response)
      })
    }else if(req.body.payment === 'paypal'){ 
      console.log('paypal if')
      res.json({
        status:true
      })
    }else{
      res.send('final else')
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


router.get('/cancelOrder',(req,res)=>{
  productHelpers.cancelOrder()
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
    // productHelpers.reduceProductCount(req.body['order[receipt]'])
  })
})

router.get('/paymentSuccessful',(req,res)=>{
  res.render('users/ThankYouPage',{
    css: 'user/navbar',
    css1:'user/thankYouPage',
  })
})
 
router.get('/addressManagement',async(req,res)=>{
  let addresses = await userHelpers.getAddresses(req.session.user._id)
  console.log('2addresses')
  console.log(addresses)
  res.render('users/address',{
    css:'user/navbar',
    css1:'user/address',
    addresses : addresses,
    user: req.session.user._id 
  }) 
})

router.post('/newAddress/:id',(req,res)=>{
  userHelpers.addAddress(req.params.id,req.body)
  res.redirect('/addressManagement')
})
 
router.get('/deleteAddress/:id',(req,res)=>{
  userHelpers.deleteAddress(req.params.id)
  res.redirect('/addressManagement')
})
  

router.get('/test',(req,res)=>{
  function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (var i = 0; i < 20; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
  }
  
  console.log(makeid());

  
})



module.exports = router;


