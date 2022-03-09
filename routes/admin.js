var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/admin/productHelpers')
const userManageHelpers = require('../helpers/admin/userManageHelpers')
const fs = require('fs');
const { response } = require('express');

/* GET home page. */
router.get('/',async function (req, res, next) {

  let compReport = await productHelpers.get_complete_report()
  let monthReport = await productHelpers.get_thisMonth_report()
  let salesPerMonth = await productHelpers.salesPerMonth()
  let orderStatus = await productHelpers.orderStatus()
  let todayOrderCount = await productHelpers.todayOrderCount()
  console.log(salesPerMonth)
  console.log(new Date().toLocaleString('en-us',{month:'short'}))
  res.render('admin/admin', {
    admin: true,
    dashboard: 'active',
    css: 'admin/home',
    css1: 'admin/navbar',
    compReport,
    monthReport,
    salesPerMonth,
    orderStatus,
    todayOrderCount
  });
});

router.get('/product_management', (req, res) => {
  productHelpers.getProducts((data) => {
    res.render('admin/product_management', {
      admin: true,
      productManagement: 'active',
      css: 'admin/product_management',
      products: data,
      css1: 'admin/navbar'
    })
  })
})

router.get('/addProduct', (req, res) => {
  res.render('admin/addProduct', {
    productManagement: 'active',
    css: 'admin/addProduct',
    css1: 'admin/navbar',
    product: req.session.product,
    js:'admin/validate',
    js1:'admin/newcrop'

  })
  req.session.product = null
})

router.post('/addProduct', (req, res) => {

  let imageArr = [];
  if (req.files?.files.length) {
    for (var i = 0; i < req.files.files.length; i++) {
      imageArr.push(i)
    }
  } else if (req.files) {
    imageArr.push(1)
  }

  req.body.imageArr = imageArr

  productHelpers.addProduct(req.body, (data, err) => {
    let productId = data.insertedId.toString()
    req.body.slno = productId;

    if (req.files) {

      let dir = './public/images/products/' + productId

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
      }

      let length;
      if (Array.isArray(req.files.files)) {
        length = req.files.files.length
        for (var i = 0; i < length; i++) {
          let image = req.files.files[i]
          image.mv('./public/images/products/' + productId + '/' + i + '.jpg')

        }
      } else {
        let image = req.files.files
        image.mv('./public/images/products/' + productId + '/' + 0 + '.jpg')
      }

    }

    res.redirect('/admin/product_management')
  })
})


router.get('/product/:id', (req, res) => {
  productHelpers.deleteProducts(req.params.id).then((response) => {
    res.redirect('/admin/product_management')
  })
})


router.get('/edit-product/:id', (req, res) => {
  productHelpers.getProduct(req.params.id, (product) => {

    req.session.product = product
    res.redirect('/admin/addProduct')

  })
})

router.post('/updateProduct/:id', (req, res) => {
  productHelpers.updateProduct(req.params.id, req.body, (data, err) => {
    res.redirect('/admin/product_management')
  })
})


router.get('/user-management', (req, res) => {
  userManageHelpers.getAllUsers((response)=>{
    res.render('admin/user-management', {
      admin: true,
      usermanagement: 'active',
      css: 'admin/user-management',
      css1: 'admin/navbar',
      users: response
    })
  })
})
 

router.get('/blockuser/:id',(req,res)=>{
  userManageHelpers.blockuser(req.params.id)
  res.redirect('/admin/user-management')
})

router.get('/unblockuser/:id',(req,res)=>{
  userManageHelpers.unblockuser(req.params.id)
  res.redirect('/admin/user-management')
})

router.get('/orders',async(req,res)=>{
  let orders = await productHelpers.getOrders()
  res.render('admin/Orders',{
    css:'admin/Orders',
    css1 : 'admin/navbar',
    orders : orders
  })
})

router.get('/offers',async(req,res)=>{
  let coupons = await productHelpers.getCoupons()
  console.log(coupons)
  res.render('admin/Offers',{
    css:'admin/Offers',
    css1:'admin/navbar',
    coupons
  })
})

router.post('/changeStatus',(req,res)=>{
  productHelpers.changeStatus(req.body)
})

router.post('/deliveredOrder',(req,res)=>{
  productHelpers.deliveredOrder(req.body,()=>{
    res.json({})
  })
})


router.post('/addCoupon',(req,res)=>{
  productHelpers.addCoupon(req.body)
  res.redirect('/admin/Offers')
})

router.post('/removeCoupon',(req,res)=>{
  productHelpers.removeCoupon(req.body.id,(response)=>{
    res.json({})
  })
})

router.get('/reports',(req,res)=>{
  productHelpers.getdelivereds().then((data)=>{
    res.render('admin/reports',{
      css:'admin/navbar',
      css1:'admin/reports',
      data
  })
  })
})

router.post('/salesreport/report', async (req, res) => {
  let salesReport = await productHelpers.getSalesReport(req.body.from, req.body.to)
  console.log({salesReport})
  res.json({ report: salesReport })
})

router.post('/salesreport/monthlyreport', async (req, res) => {
  let singleReport = await productHelpers.getNewSalesReport(req.body.type)
  res.json({ wmyreport: singleReport })
})

router.get('/salesreport', async (req, res) => {
  let salesreport = await productHelpers.getsalesReport()
  res.render('admin/salesreport', { admin: true, salesreport })
})
  




module.exports = router;
