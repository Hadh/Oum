const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('../config/database');
const User = require('../models/user');
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');
const hsb = require('nodemailer-express-handlebars');


/* GET users listing. */
router.get('/',function(req, res, next) {
    User.find({}, function(err, users) {
        res.json(users);
    });
});


//get all admins
router.get('/get_admins',function(req,res){
    User.find({admin: true}, function(err,admins){
        if(err) console.log(err);
        else {
            res.json({success:true,admins})
        }
    });
});

// Register
router.post('/register', (req, res, next) => {
    const stringToken = randomstring.generate();
    let newUser = new User({
        name: req.body.name,
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        admin:false,
        active: false,
        secretToken: stringToken
  });

  User.addUser(newUser, (err, user) => {
    if(err){
        console.log(err)
      res.json({success: false, msg:'Failed- User already exists!'});
    } else {

        let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: 'soccerstar.laouini@gmail.com',
              pass: 'kxgzenwxufpogyqe'
          }
      });

    let str = 'http://localhost:/verify_account/'+stringToken

        transporter.use('compile', hsb({
            viewPath: './views/',
            extName:'.hbs'
        }));

        var mailOptions = {
            from: ' Team',
            to: newUser.email,
            subject: 'Account Verification',
            template:'verification',
            context:{
              linkVerify:str
            },
            template: 'email'
        };

        transporter.sendMail(mailOptions, function (err, res) {
            if(err){
                console.log(err);
            } else {
                console.log('Email Sent');
            }
        });


        res.json({success: true, msg:'User registered! Please Check your email'});
    }
  });
});

router.post('/add_admin',function(req,res){
    let newAdmin = new User({
        name: req.body.name,
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        admin:true,
        active: false
    });
    User.addUser(newAdmin, (err, user) => {
       if(err) console.log(err);
       else {
           res.json({success:true, msg: "Admin added with success"});
       }
    });
});

// Authenticate
router.post('/authenticate', (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  User.getUserByEmail(email, (err, user) => {
    if(err) throw err;
    if(!user){
      return res.json({success: false, msg: 'User not found'});
    }
      /*check if user account is active*/
    if(!user.active)
        return res.json({success: false, msg: 'Please Verify You Account!'});
    User.comparePassword(password, user.password, (err, isMatch) => {
      if(err) throw err;
      if(isMatch){
        const token = jwt.sign({data: user}, config.secret, {
          expiresIn: 604800 // 1 week
        });

        res.json({
          success: true,
          token: `Bearer ${token}`,
          user: {
            id: user._id,
            name: user.name,
            username: user.username,
            email: user.email
          }
        });
      } else {
        return res.json({success: false, msg: 'Wrong password'});
      }
    });
  });
});

// Profile
router.get('/profile', passport.authenticate('jwt', {session:false}), (req, res, next) => {
  res.json({user: req.user});
});

// verify account
router.route('/verify')
    .get( (req, res) => {
        return res.json({success: false, msg: 'You should be seeing the verify page'});
    })
    .post(async (req, res, next) => {
        try{
            const secretToken = req.body.secretToken;
            const user = await User.findOne({ 'secretToken' : secretToken });
            if(!user){
                return res.json({success: false, msg: 'Error - No User Found!'});
            }
            user.active = true;
            user.secretToken = "";
            await user.save();
            return res.json({success: true, msg: 'Thank you! You may now login'});

        } catch (error){
            next(error);
        }

    });

module.exports = router;
