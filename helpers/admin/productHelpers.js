const { response } = require('express')
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
                        date:'$date'.toString(),
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
    },

    get_complete_report:()=>{
        return new Promise (async(resolve,reject)=>{
            let report = await db.get().collection('delivered').aggregate([
                 {
                     $group:{
                        _id:null,
                        total:{
                            $sum:'$totalAmount'
                        }
                     }
                 }
             ]).toArray()
             resolve(report[0]?.total | 0)
        })
    },


    get_thisMonth_report:()=>{
        
        return new Promise(async(resolve,reject)=>{
            let report = await db.get().collection('delivered').aggregate([
                {
                    $match:{
                        date:{
                            $gt:new Date(new Date().getFullYear(),new Date().getMonth(),1)
                        }
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{
                            $sum:'$totalAmount'
                        }
                    }
                }
            ]).toArray()
            resolve(report[0]?.total | 0 )
        })
    },


    salesPerMonth : ()=>{

        return new Promise(async(resolve,reject)=>{
            let report = await db.get().collection('delivered').aggregate([
                {
                    $group:{
                        _id:{$month:'$date'},
                        totalAmount:{
                            $sum:'$totalAmount'
                        }
                    }
                },
                {
                    $sort:{_id:1} 
                }
            ]).toArray()
            console.log(report)
            resolve(report)
        })
    },


    orderStatus : ()=>{
        return new Promise (async(resolve,reject)=>{
            let report = await db.get().collection('order').aggregate([
                {
                    $group:{
                        _id:'$status',
                        count:{
                            $sum:1
                        }
                    }
                },
                {
                    $sort:{_id:1}
                }
            ]).toArray()
            resolve(report)
        })
    },

    todayOrderCount :()=>{
        return new Promise(async(resolve,reject)=>{
            let count = await db.get().collection('order').aggregate([
                {
                    $match:{
                        date:{
                            $gte:new Date(
                                new Date().getFullYear(),
                                new Date().getMonth(),
                                new Date().getDay()-1,
                                0).toString()
                        }
                    }
                },
                {
                    $count:'orderCount'
                }
            ]).toArray()
            resolve(count[0]?.orderCount | 0)
        })
    },

    addCoupon : (data)=>{
        return new Promise ((resolve,reject)=>{
            console.log(data)
            db.get().collection('coupon').insertOne(data).then((response)=>{
                resolve(response)
            })
        })
    },

    getCoupons : ()=>{
        return new Promise(async(resolve, reject)=>{
            let coupons = await db.get().collection('coupon').find().toArray()
            resolve(coupons)
        })
    },

    removeCoupon : async(couponId,callback)=>{
        console.log('what happened')
        let response = await db.get().collection('coupon').deleteOne({_id:objectId(couponId)})
        callback(response)
    },

    getdelivereds : ()=>{
        return new Promise(async(resolve,reject)=>{
            let response = await db.get().collection('delivered').find().toArray()
                resolve(response)
        })
    },






    getsalesReport: () => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection('delivered').aggregate([
                {
                    $match: { $and: [{ status: { $ne: 'cancelled' } }, { status: { $ne: 'pending' } }] }
                },
                {
                    $project: {
                        orderId: '$orderId',
                        userId: '$userId',
                        paymentMethod: '$paymentMethod',
                        totalAmount: '$totalAmount',
                        date: '$date',
                        products: '$products'
                    }
                },
            ]).toArray()
            resolve(orderItems)
        })
      },
    
    
      getweeklyreport: async () => {
        const dayOfYear = (date) =>
            Math.floor(
                (date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
            )
        return new Promise(async (resolve, reject) => {
            const data = await db.get().collection('delivered').aggregate([
                {
                    $match: {
                        $and: [{ status: { $ne: 'cancelled' } }, { status: { $ne: 'pending' } }],
                        date: { $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000) },
                    },
                },
    
                { $group: { _id: { $dayOfYear: '$date' }, count: { $sum: 1 } } },
            ]).toArray()
            const thisday = dayOfYear(new Date())
            let salesOfLastWeekData = []
            for (let i = 0; i < 8; i++) {
                let count = data.find((d) => d._id === thisday + i - 7)
    
                if (count) {
                    salesOfLastWeekData.push(count.count)
                } else {
                    salesOfLastWeekData.push(0)
                }
            }
            console.log(salesOfLastWeekData);
            resolve(salesOfLastWeekData)
    
        })
      },
    
      getSalesReport: (from, to) => {
        console.log(new Date(from));
        console.log(new Date(to));
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection('delivered').aggregate([
                {
                  $match: {
                    date: { $gte: new Date(from), $lte: new Date(to) },
                  }
                },
            ]).toArray()
            resolve(orders)
        })
      },
    
      getNewSalesReport: (type) => {
        const numberOfDays = type === 'daily' ? 1 : type === 'weekly' ? 7 : type === 'monthly' ? 30 : type === 'yearly' ? 365 : 0
        const dayOfYear = (date) =>
            Math.floor(
                (date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
            )
        return new Promise(async (resolve, reject) => {
            const data = await db.get().collection('delivered').aggregate([
                {
                    $match: {
                        date: { $gte: new Date(new Date() - numberOfDays * 60 * 60 * 24 * 1000) },
                    },
                },
            ]).toArray()
            console.log(data);
            resolve(data)
    
        })
      },


    
    
}
