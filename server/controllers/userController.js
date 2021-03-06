const User = require('../models/users')
const jwt  = require('jsonwebtoken')
const {OAuth2Client} = require('google-auth-library')
const { generatePassword, checkPassword, sendMailConf} = require('../helpers')
const axios = require('axios')

module.exports = {

    signup: function(req,res){
        generatePassword(req.body.email, req.body.password)
        .then(function(passwordhasGenerate) {
            let saveUSer = new User({
                name:  req.body.name,
                gender: req.body.gender,
                phoneNumber: req.body.phone,
                address : req.body.address,
                email:   req.body.email,
                password: passwordhasGenerate
            })
            return saveUSer
        })
        .then(function(saveUSer) {
            saveUSer.save()
            .then(function(data){
                sendMailConf(data.email)
                res.status(200).json({
                    message : 'Signup Success'
                })
            })
            .catch(function(err){
                res.status(500).json({
                    error : err.errors
                })
            })
        })
        .catch(function(err){
           console.log(err)
        })
    },

    signin: function(req,res){
        User.findOne({
            email : req.body.email
        })
        .then(function(dataUser){
            user = dataUser
            return checkPassword(user.password, req.body.password, req.body.email)
        })
        .then(function(){
            
            let userId = user._id
            jwt.sign({
                userId : userId,
                name : user.name,
                email : user.email
            }, process.env.ACCESS_DATA, function(err,token){
                if(!err){
                    res.status(200).json({
                        userId,
                        name : user.name,
                        email: user.email,
                        token : token
                    })
                } else {
                    res.status(500).json({
                        error : err.message
                    })
                }
            })
        })
        .catch(function(){
            res.status(500).json({
                message : `email and password didn't match`
            })
        })
    },

    signinFacebook: function(req,res){
        let token = req.body.token
        let dataUser = null
        axios({
            method:'GET',
            url: `https://graph.facebook.com/me?fields=name,email&access_token=${token}'`
        })
        .then(function(response) {
            dataUser = response
            return User.find(
                { email: response.data.email }
            )
        })
        .then(function(data){
            
            if(data.length > 0){
                let id = data[0]._id
                jwt.sign({
                    userId : id,
                    name : data[0].name,
                    email : data[0].email
                }, process.env.ACCESS_DATA, (err, newToken) => {
                    res.status(200).json({
                        userId : id,
                        name : data[0].name,
                        email : data[0].email,
                        token : newToken
                    })
                })
            } else {
                let dataLogin = new User({
                    name: dataUser.data.name,
                    gender : 'todoApp',
                    address : 'todoApps',
                    phoneNumber: dataUser.data.email,
                    email: dataUser.data.email,
                    password: 'todoApp'
                })
                dataLogin.save()
                .then(function(user){
                    sendMailConf(user.email)
                    let id = user._id
                        jwt.sign({
                            userId : id,
                            name : user.name,
                            email : user.email
                        }, process.env.ACCESS_DATA, (err, newToken) => {
                            res.status(200).json({
                                token : newToken
                            })
                        })
                })
                .catch(function(err){
                    
                })
            }
        })
        .catch(function(err){
            console.log(err)
        })
    },

    signinGoogle: function(req,res){

        let token = req.headers.token
        let CLIENT_ID = '1083675313112-0apmjvrb5cd1dm58i362esnekkfpeif4.apps.googleusercontent.com'
        const client = new OAuth2Client(CLIENT_ID);
        async function verify() {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const userid = payload['sub']
        }

        let dataUSer = null
        axios({
            method:'GET',
            url: `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}'`
        })
        .then(function(response) {
            dataUser = response
            return User.find(
                { email: response.data.email }
            )
        })
        .then(function(data){
            if(data.length > 0){
                let id = data[0]._id
                jwt.sign({
                    userId : id,
                    name : data[0].name,
                    email : data[0].email
                }, process.env.ACCESS_DATA, (err, newToken) => {
                    res.status(200).json({
                        userId : id,
                        name : data[0].name,
                        email : data[0].email,
                        token : newToken
                    })
                })
            } else {
                let dataLogin = new User({
                    name: dataUser.data.name,
                    gender : 'todoApp',
                    address : 'todoApps',
                    phoneNumber: dataUser.data.email,
                    email: dataUser.data.email,
                    password: 'todoApp'
                })
    
                dataLogin.save(function (err,user){
                    sendMailConf(user.email)
                    let id = user._id
                    if (!err) {
                        jwt.sign({
                            userId : id,
                            name : user.name,
                            email : user.email
                        }, process.env.ACCESS_DATA, (err, newToken) => {
                            res.status(200).json({
                                token : newToken
                            })
                        })
                    } else {
                       
                    }
                })
            }
        })

        .catch(function(err){
            console.log(err)
        })
        verify().catch(console.error);
    },

    update: function(req,res){
        User.findByIdAndUpdate(
            { _id : req.params.id}, 
            { 
              name:  req.body.name,
              gender: req.body.gender,
              phoneNumber: req.body.phoneNumber,
              address : req.body.address,
              email:   req.body.email,
            }
        )
        .then(function(user){
            res.status(200).json({
                message : `update user success`
            })
        })
        .catch(function(err){
            res.status(500).json({
                err
            })
        })
    },

    remove: function(req,res){
        User.findByIdAndRemove(
            { _id : req.params.id},
        )
        .then(function(user){
            res.status(200).json({
                message : `delete user ${user.name} success`
            })
        })
        .catch(function(err){
            res.status(500).json({
                err
            })
        })
    }
}