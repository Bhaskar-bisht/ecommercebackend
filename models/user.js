const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi")
const passwordComplexity = require("joi-password-complexity")


const userSchema = new mongoose.Schema({
    name: {
        type: String
    },
    email:{
        type: String,
        require: true
    },
    password:{
        type: String,
        required: true
    },
    cartData: {
        type: Object,
    },
    date: {
        type: Date,
        default: Date.now
    }

})

// User.pre("save", async function (next){
//     if(!this.isModified("password")){
//       next();
//     }
  
//     this.password = await bcrypt.hash(this.password, 10);
//   });

//   // jwt token
//   User.methods.getJwtToken = function () {
//     return jwt.sign({ id: this._id}, "sdjsdbvjsd51sdf56sdvfs56d%$%@Sd56d",{
//       expiresIn: "7d",
//     });
//   };
  
//   // compare password
//   User.methods.comparePassword = async function (enteredPassword) {
//     return await bcrypt.compare(enteredPassword, this.password);
//   };

userSchema.method.generateAuthToken = function () {
  const token = jwt.sign({_id: this.id}, process.env.JWTPRIVATEKEY, {expiresIn: "7d"})
  return token
}

const User = mongoose.model("User", userSchema)

  // module.exports = User
  const validate = (data) => {
    const schema = Joi.object({
      email: Joi.string().email().required().label("Email"),
      password: passwordComplexity().require().label("Password")
    })
    return schema.validate(data)
  }

  module.exports = {User, validate}