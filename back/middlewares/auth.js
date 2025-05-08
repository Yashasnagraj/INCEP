const joi=require("joi");

const signupvalidator=(req,res,next)=>{
    const schema=joi.object({
        name:joi.string().required().min(3).max(30),
        email:joi.string().email().required(),
        password:joi.string().required().min(6).max(30)
    });
    const {error}=schema.validate(req.body);
    if(error){
        return res.status(400).json({error:error.message});
    }
    next();
}
const loginvalidator=(req,res,next)=>{
    const schema=joi.object({     
        email:joi.string().email().required(),
        password:joi.string().required().min(6).max(30)
    });
    const {error}=schema.validate(req.body);
    if(error){
        return res.status(400).json({error:error.message});
    }
    next();
}
module.exports={signupvalidator,loginvalidator};