const { response } = require('express')
const db = require('../../config/connection')
var objectId = require('mongodb').ObjectId

module.exports = {

    Auth: (req, res, next) => {
        if (req.session.userLoggedIn) {
            next()
        } else {
            return res.redirect('/login')
        }
    },

    checkNumber: (Number) => {
        return new Promise(async (resolve, reject) => {
            var data = await db.get().collection('users').findOne({ mobile: Number })
            resolve(data)
        })
    },

    saveNumber: (Number) => {
        return new Promise((resolve, reject) => {
            db.get().collection('users').insertOne({ mobile: Number, block: false}).then((data) => {
                resolve(data.insertedId)
            })
        })
    },

    getUser: (Number) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection('users').find({ mobile: Number }).toArray()
            resolve(user)
        })
    },

    updateUser: (data) => {
        return new Promise((resolve, reject) => {
            console.log('data')
            console.log(data)
            db.get().collection('users').updateOne({ mobile: data.mobile }, {
                $set: {
                    name: data.name,
                    email: data.email
                }
            }).then((response) => {
                resolve(response)
            })
        })
    }, 

 
    addAddress : (user,data)=>{
        db.get().collection('address').insertOne({user:objectId(user),address:data}).then((response)=>{
        })
    },


    getAddresses : (userId)=>{
        return new Promise(async(resolve, reject)=>{
            let addresses = await db.get().collection('address').find({user:objectId(userId),deleted:{$ne:true}}).toArray()
            console.log('1addresses')
            console.log(addresses)
            resolve(addresses)
        })
    },


    deleteAddress : (addressId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection('address').deleteOne({_id:objectId(addressId)}).then((response)=>{
                resolve(response)
            })
        })
    } 

}