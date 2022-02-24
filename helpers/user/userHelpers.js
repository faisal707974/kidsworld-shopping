const { response } = require('express')
var db = require('../../config/connection')


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
    }

}