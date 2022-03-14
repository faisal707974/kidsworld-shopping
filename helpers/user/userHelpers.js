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

    saveNumber: (Number,referal) => {

        function makeid() {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
          
            for (var i = 0; i < 10; i++)
              text += possible.charAt(Math.floor(Math.random() * possible.length));
          
            return text;
          }
          let referalCode  = makeid().toUpperCase()


        return new Promise((resolve, reject) => {
            db.get().collection('users').insertOne({ mobile: Number, block: false, referalCode:referalCode, referedBy:referal}).then((data) => {
                resolve(data.insertedId)
            })
            if(referal){
                db.get().collection('users').updateOne({referalCode:referal},{$inc:{wallet:50}})
            }
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
            resolve(addresses)
        })
    },


    deleteAddress : (addressId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection('address').deleteOne({_id:objectId(addressId)}).then((response)=>{
                resolve(response)
            })
        })
    },

    checkreferal : (userId)=>{
        return new Promise(async(resolve, reject)=>{
            let user = await db.get().collection('users').find({_id:objectId(userId)}).toArray()
            if(user[0].referedBy){
                if(user[0].referalused){
                    resolve(false)
                }else{
                    resolve(true)
                }
            }else{
                resolve(false)
            }
        })
    },

    referalused : (userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection('users').updateOne({_id:objectId(userId)},{$set:{referalused:true}})
        })
    }

}