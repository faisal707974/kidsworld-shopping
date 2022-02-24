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
    }


}