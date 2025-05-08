const express=require('express');
const { signupvalidator, loginvalidator } = require('../middlewares/auth');
const { signup, login } = require('../controllers/userctr');
const router=express.Router();


router.post('/signup',signupvalidator,signup);
router.post('/login',loginvalidator,login);

module.exports=router;