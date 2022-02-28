const async = require('hbs/lib/async')
var db = require('../../config/connection')
var objectId = require('mongodb').ObjectId


module.exports = {

    addProduct:(product,callback)=>{
        db.get().collection('products').insertOne(product).then((data,err)=>{
            callback(data,err) 
        })
    },

    getProducts:async(callback)=>{
        var products = await db.get().collection('products').find().toArray()
        callback(products)
    },

    deleteProducts: (id)=>{
        return new Promise(async(resolve, reject)=>{
           let status = await db.get().collection('products').remove({_id:objectId(id)}).then((data)=>{
                resolve(data)
            })
            resolve(status)
        })
    },


    getProduct: async(id,callback)=>{
        let product = await db.get().collection('products').findOne({_id:objectId(id)})
        callback(product)
    },

    updateProduct:(id,product,callback)=>{
        db.get().collection('products').updateOne({_id:objectId(id)},{
            $set:{
                name:product.name,
                description:product.description,
                price:product.price,
                maxPrice:product.maxPrice,
                brand:product.brand,
                offer:product.offer,
                stock:product.stock,
                categories:product.categories
            }
        }).then((data,err)=>{
            callback(data,err) 
        })
    },

    productsCount:async(callback)=>{
        let count = await db.get().collection('products').find().count()
        callback(count)
    },

    imagesCount : async(callback)=>{
        // let count = await db.get().collection.('products').aggregate([{$project:{count:{$size:"$images"}}}])
    },

    getOrders :()=>{
        return new Promise (async(resolve, reject)=>{
            let orders = await db.get().collection('order').aggregate([
                {
                    $match:{}
                },
                {
                    $project:{
                        deliveryDetails:1,
                        userId: 1,
                        paymentMethod: 1,
                        status:1,
                        date:{$dateToString:{format:'%d/%m/%Y',date:'$date'}},
                        products:1
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
                        as:'productDetails'
                    }
                },
                {
                    $lookup:{
                        from:'users',
                        localField:'userId',
                        foreignField:'_id',
                        as:'userDetails'
                    }
                },
                {
                    $project:{
                        deliveryDetails:1,
                        userId:1,
                        paymentMethod:1,
                        products:1,
                        status:1,
                        date:1,
                        productDetails:{
                            $arrayElemAt:['$productDetails',0]
                        },  
                        userDetails:{
                            $arrayElemAt:['$userDetails',0]
                        }
                    }
                }
            ]).toArray()
            resolve(orders)
        })
    },


    changeStatus : (body)=>{
        db.get().collection('order').updateOne({_id:objectId(body.orderId)},{
            $set:{status:body.value}
        })
    },

    deliveredOrder : async(body,callback)=>{
       let order = await db.get().collection('order').aggregate([
           {
               $match:{
                   _id:objectId(body.orderId)
               }
           },
           {
               $project:{
                   _id:0
               }
           }
        ]).toArray()
       db.get().collection('delivered').insertOne(order[0])
       db.get().collection('order').deleteOne({_id:objectId(body.orderId)})
       callback()
    }


}