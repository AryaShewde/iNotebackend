const express = require("express");
const router = express.Router()
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fetchuser = require('../middleware/fetchuser');
const { body, validationResult } = require('express-validator');

const JWT_SECRET = "Dummytextjwtsectret";

//ROUTE 1 : Create a User using POST: (http://localhost:5000/api/auth/createuser).No Login Required
router.post('/createuser', [
    body('name', 'Enter a valid name'),
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password must be atleast 5 characters'),
], async(req, res)=>{
    let success = false;
    console.log(req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({success, errors: errors.array() });
    }

    try {
        
    
    let user = await User.findOne({email: req.body.email});
    if(user){
        return res.status(400).json({success, error: 'Sorry! A user with this email already exists'})
    }


    const salt = await bcrypt.genSalt(10);
    const secpass = await bcrypt.hash(req.body.password, salt);


    user  = await User.create({
        name: req.body.name,
        password: secpass,
        email: req.body.email,
    });

    const data ={
        user:{
            id: user.id
        }
    }
    const authtoken = jwt.sign(data, JWT_SECRET);

    // res.json({user})
    success = true;
    res.json({success, authtoken})

    
    } catch (error) {
        console.error(error.message);
        res.status(500).send(success, "Internal Server Error! Please try after some time.");
    }
})

//ROUTE 2 : Authenticate a User using POST: (http://localhost:5000/api/auth/login).No Login Required

router.post('/login', [
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password cannot be blank').exists(),
  ], async (req, res) => {
    let success = false;
    // If there are errors, return Bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (!user) {
        success = false
        return res.status(400).json({ error: "Please try to login with correct credentials" });
      }
  
      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        success = false
        return res.status(400).json({ success, error: "Please try to login with correct credentials" });
      }
  
      const data = {
        user: {
          id: user.id
        }
      }
      const authtoken = jwt.sign(data, JWT_SECRET);
      success = true;
      res.json({ success, authtoken })
  
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }
  
  
  });
  

//ROUTE 3 : Getting loggedin User Details using POST: (http://localhost:5000/api/auth/getuser).Login is Required.

router.post('/getuser', fetchuser , async(req, res)=>{
try {
    userId = req.user.id;
    const user = await User.findById(userId).select("-password")
    res.send(user);
}  catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error!");
}
})

module.exports = router;