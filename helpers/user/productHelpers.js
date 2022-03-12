const { response } = require('express')
var db = require('../../config/connection')
var objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay')

var instance = new Razorpay({
    key_id: 'rzp_test_geBt4AZgkHuX27',
    key_secret: 'x4IpIj3SjfGXCgPCmEl8Jr75',
  });

 

module.exports = {

    getProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection('products').find().toArray()
            resolve(products)
        })
    },

    getProduct: (id) => {
        return new Promise(async(resolve,reject)=>{
            let product = await db.get().collection('products').find({ _id: objectId(id) }).toArray()
            resolve(product)
        })
    },
 
    insertCart: async (userId, productId) => {

        let product = await db.get().collection('products').findOne({ _id: objectId(productId) })

        let proObj = {
            item: objectId(productId),
            quantity: 1,
            total: parseInt(product.price)
        }
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection('cart').findOne({ user: userId })
            if (cart) {
                let product = await cart.products.findIndex(product => product.item == productId)
                if (product != -1) {
                    db.get().collection('cart').updateOne({ user: userId, 'products.item': objectId(productId) }, {
                        $inc: { 'products.$.quantity': 1 }
                    }).then(() => {
                        resolve()
                    })
                } else {
                    db.get().collection('cart').updateOne({ user: userId }, {
                        $push: { products: proObj }
                    }).then(() => {
                        resolve()
                    })
                }

            } else {
                let cartdoc = {
                    user: userId,
                    products: [proObj]
                }
                db.get().collection('cart').insertOne(cartdoc).then((response) => {
                    resolve()
                })
            }
        })
    },


    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection('cart').aggregate([
                {
                    $match: { user: userId }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        total: '$products.total'
                    }
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        total: 1,
                        product: {
                            $arrayElemAt: ['$products', 0]
                        }
                    }
                }
            ]).toArray()
            console.log(cartItems)
            resolve(cartItems)
        })
    },


    cartCount: async (userId, callback) => {
        let count = 0
        let cart = await db.get().collection('cart').findOne({ user: userId })
        if (cart) {
            count = cart.products.length
        }
        return count
    },

    changeProductQuantity: (body) => {
        body.count = parseInt(body.count)
        return new Promise((resolve, reject) => {
            db.get().collection('cart').updateOne({ 'products.item': objectId(body.product), _id: objectId(body.cart) }, {
                $inc: { 'products.$.quantity': body.count }
            }).then((response) => {
                resolve(response.modifiedCount)
            })
        })
    },

    changeProductTotalPrice: (body) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection('cart').updateOne({ 'products.item': objectId(body.product), _id: objectId(body.cart) }, {
                $set: { 'products.$.total': parseInt(body.total) }
            }).then((response) => {
            })
        })
    },


    deleteCartItem: (body) => {
        return new Promise((resolve, reject) => {
            db.get().collection('cart').updateOne({ _id: objectId(body.cart) }, {
                $pull: {
                    products: {
                        item: objectId(body.product)
                    }
                }
            }).then((response) => {
                resolve(response)
            })
        })
    },

    cartProductsCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection('cart').aggregate([
                {
                    $match: { user: userId }
                },
                {
                    $project: { products: 1 }
                }
            ]).toArray()
            resolve(products)
        })
    },

    cartTotal: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection('cart').aggregate([
                {
                    $match: {
                        user: userId
                    }
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        total:'$products.total'
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:'$total'}
                    }
                }
            ]).toArray()
            console.log({total})
            resolve(total)
        })
    },

    placeOrder : (order,products,totalPrice)=>{
        console.log({products})
        return new Promise ((resolve,reject)=>{
            let status =  order.payment==='cod'?'placed':'pending'
            let orderObj = {
                deliveryDetails : {
                    
                    address: order.address,
                    
                },
                userId : objectId(order.userId),
                paymentMethod : order.payment,
                products:products,
                totalAmount:totalPrice,
                status: status,
                date: new Date().toString()
            }

            db.get().collection('order').insertOne(orderObj).then((response)=>{
                db.get().collection('cart').deleteOne({user:order.userId})
                console.log('ordered and cart deleted')
                resolve(response.insertedId.toString())
            })
        })
    },

    getCartProductList : (userId)=>{
        return new Promise (async(resolve, reject)=>{
            let cart = await db.get().collection('cart').findOne({user:userId})
            resolve(cart?.products)
        })
    },

 

    getOrders : (userId)=>{
        return new Promise (async(resolve,reject)=>{
           let orders = await db.get().collection('order').aggregate([
               {
                   $match:{
                       userId:objectId(userId)
                   }
               },
               {
                   $unwind:'$products'
               }, 
               {
                   $lookup:{
                       from:'products',
                       localField:'products.item',
                       foreignField:'_id',
                       as:'product'
                   }
               },
               {
                   $project:{
                    deliveryDetails:1,
                    paymentMethod:1,
                    products:1,
                    totalAmount:1,
                    status:1,
                    // date:{$dateToString:{format:'%d/%m/%Y',date:'$date'}},
                    product:{
                        $arrayElemAt :['$product',0]
                    }
                   }
               }
           ]).toArray()
            resolve(orders)

        })
    },



    generateRazorpay : (orderId,total)=>{
        return new Promise ((resolve,reject)=>{
            instance.orders.create({
                amount: total*100,
                currency: "INR",
                receipt: orderId,
                notes: {
                  key1: "value3",
                  key2: "value2"
                }
              },(err,order)=>{

                  resolve(order)
              })
        })
    },


    verifyPayment: (details)=>{
        return new Promise ((resolve, reject)=>{
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256','x4IpIj3SjfGXCgPCmEl8Jr75')
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if(hmac == details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },
    
    changePaymentStatus : (orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection('order').updateOne({_id:objectId(orderId)},
            {
                $set:{
                    status: 'placed'
                }
            }).then(()=>{
                resolve()
            })
        })
    },

    // reduceProductCount : (orderId)=>{
    //     db.get().collection('products').updateOne({})
    // }


    cancelOrder : (orderId)=>{ 
        const promise =  new Promise((resolve,reject)=>{
            db.get().collection('order').updateOne({_id:objectId(orderId)},{$set:{status:'Cancelled'}}).then((response)=>{
                resolve(response)
            })
        })
        return promise
    }, 


    checkCoupon : (code,userId)=>{
        return new Promise((resolve,reject)=>{
           db.get().collection('coupon').findOne({code:code,users:{$ne:userId}}).then((response)=>{
               resolve(response)
           })
        })
    },

    add_user_to_coupon : (userId,couponId)=>{
        db.get().collection('coupon').updateOne({_id:objectId(couponId)},{$push:{users:userId}})
    },


}